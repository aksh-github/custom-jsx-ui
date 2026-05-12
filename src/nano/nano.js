/**
 * nano.js — Lightweight SFC component runtime
 */

// ─── Signals (fine-grained reactivity) ─────────────────────────────────────

let currentEffect = null;

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    if (currentEffect) {
      subscribers.add(currentEffect);
      // Tell the running effect which subscriber set it just joined
      // so it can remove itself later when disposed
      currentEffect._addCleanup?.(subscribers);
    }
    return value;
  };

  const write = (newValue) => {
    const next = typeof newValue === "function" ? newValue(value) : newValue;
    if (next === value) return;
    value = next;
    subscribers.forEach((fn) => fn());
  };

  read.set = write;
  read._subscribers = subscribers;
  read._isSignal = true;
  return read;
}

export function effect(fn) {
  // All subscriber sets this effect has joined across every signal it read
  const joinedSets = new Set();

  const run = () => {
    const prev = currentEffect;
    currentEffect = run;
    try {
      fn();
    } finally {
      currentEffect = prev;
    }
  };

  // signal() calls this whenever run() subscribes to it
  run._addCleanup = (subscriberSet) => joinedSets.add(subscriberSet);

  run();

  // Dispose: pull this effect out of every signal's subscriber list.
  // After this, no signal can ever invoke run() again, so the TextNodes/
  // elements it closed over become unreachable and are GC'd.
  return function dispose() {
    joinedSets.forEach((set) => set.delete(run));
    joinedSets.clear();
  };
}

export function computed(fn) {
  const s = signal(undefined);
  s._dispose = effect(() => s.set(fn()));
  return s;
}

// ─── Component Registry ─────────────────────────────────────────────────────

const registry = new Map();
const instanceMap = new WeakMap();

export function defineComponent(tag, loader) {
  if (registry.has(tag)) return;
  registry.set(tag, { loader, module: null, loaded: false });
}

// ─── SFC Loader ─────────────────────────────────────────────────────────────

export async function fetchSFC(url) {
  const text = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`[nano] SFC fetch failed ${r.status}: ${url}`);
    return r.text();
  });

  const doc = new DOMParser().parseFromString(text, "text/html");
  const templateEl = doc.querySelector("template");
  const styleEl = doc.querySelector("style");
  const scriptEl = doc.querySelector("script");

  if (!templateEl) throw new Error(`[nano] SFC missing <template>: ${url}`);
  if (!scriptEl) throw new Error(`[nano] SFC missing <script>: ${url}`);

  const blob = new Blob([scriptEl.textContent], { type: "text/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  const mod = await import(blobUrl);
  URL.revokeObjectURL(blobUrl);

  const setupFn = mod.default ?? mod.setup;
  if (typeof setupFn !== "function")
    throw new Error(
      `[nano] SFC <script> must default-export a setup(ctx) function: ${url}`,
    );

  return {
    _isSFC: true,
    template: templateEl.innerHTML,
    styles: styleEl?.textContent ?? null,
    setup: setupFn,
  };
}

// ─── SFC Template Renderer ───────────────────────────────────────────────────

function mountSFCTemplate(templateHtml, hostEl, ctx) {
  const disposes = [];

  const markers = new Map();
  const seeded = templateHtml.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
    const id = `__nb_${Math.random().toString(36).slice(2)}`;
    markers.set(id, name);
    return `<span data-nb="${id}"></span>`;
  });

  const tpl = document.createElement("template");
  tpl.innerHTML = seeded;
  const frag = tpl.content;

  markers.forEach((name, id) => {
    const span = frag.querySelector(`[data-nb="${id}"]`);
    if (!span) return;
    const val = ctx[name];
    if (typeof val === "function" && val._isSignal) {
      const text = document.createTextNode(val());
      span.replaceWith(text);
      disposes.push(
        effect(() => {
          text.nodeValue = String(val());
        }),
      );
    } else {
      span.replaceWith(document.createTextNode(String(val ?? "")));
    }
  });

  frag.querySelectorAll("*").forEach((el) => {
    for (const { name, value } of [...el.attributes]) {
      if (name.startsWith("@")) {
        const eventName = name.slice(1);
        const handler = (e) => ctx[value]?.(e);
        registerNodeEvent(el, eventName, handler);
        el.removeAttribute(name);
      } else if (name.startsWith(":")) {
        const boundVal = ctx[value];
        const attrName = name.slice(1);
        if (typeof boundVal === "function" && boundVal._isSignal) {
          disposes.push(effect(() => el.setAttribute(attrName, boundVal())));
        } else {
          el.setAttribute(attrName, String(boundVal ?? ""));
        }
        el.removeAttribute(name);
      }
    }
  });

  hostEl.innerHTML = "";
  hostEl.appendChild(frag);
  return disposes;
}

function registerNodeEvent(node, eventName, handler) {
  if (!node || !eventName || typeof handler !== "function") return;
  if (!node._events) node._events = Object.create(null);
  if (!node._events[eventName]) node._events[eventName] = [];
  node._events[eventName].push(handler);
  // Use capture=true to match teardown in disposeNodes().
  node.addEventListener(eventName, handler, true);
}

// ─── Component Lifecycle ────────────────────────────────────────────────────

async function mountComponent(el) {
  const tag = el.tagName.toLowerCase();
  const entry = registry.get(tag);
  if (!entry) return;

  if (!entry.loaded) {
    try {
      el.setAttribute("nano-state", "loading");
      const mod = await entry.loader();
      entry.module = mod._isSFC ? mod : mod.default || mod;
      entry.loaded = true;
      el.setAttribute("nano-state", "loaded");
    } catch (err) {
      el.setAttribute("nano-state", "error");
      console.error(`[nano] Failed to load component <${tag}>:`, err);
      return;
    }
  }

  const def = entry.module;
  if (!def) return;

  const props = {};
  for (const attr of el.attributes) {
    if (attr.name.startsWith("nano-")) continue;
    props[attr.name] = attr.value;
  }

  // ── Tracked primitives ────────────────────────────────────────────────────
  // Every effect() or computed() created during setup is registered here.
  // They are all disposed automatically when the element is removed from DOM.
  const disposes = [];

  function trackedEffect(fn) {
    const dispose = effect(fn);
    disposes.push(dispose);
    return dispose;
  }

  function trackedComputed(fn) {
    const s = signal(undefined);
    s._dispose = trackedEffect(() => s.set(fn()));
    return s;
  }

  // ─────────────────────────────────────────────────────────────────────────

  const context = {
    el,
    props,
    signal, // signals are passive — no disposal needed
    computed: trackedComputed,
    effect: trackedEffect,
    defineComponent,
    route,
    initRouter,
    fetchSFC,
    emit(eventName, detail) {
      el.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
    },
    onMount(fn) {
      queueMicrotask(fn);
    },
    onDestroy(fn) {
      const obs = new MutationObserver((_, o) => {
        if (!document.contains(el)) {
          fn();
          o.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    },
  };

  if (def.styles) injectStyles(tag, def.styles);

  await def.setup(context);
  const templateDisposes = mountSFCTemplate(def.template, el, context);
  disposes.push(...templateDisposes);

  // Auto-dispose: no manual onDestroy needed in components for signal cleanup
  context.onDestroy(() => {
    disposes.forEach((d) => d());
    disposes.length = 0;
    void disposeNodes(el);
    instanceMap.delete(el);
  });

  instanceMap.set(el, context);
  el.setAttribute("nano-state", "mounted");
}

// ─── Scoped Styles ──────────────────────────────────────────────────────────

const injectedStyles = new Set();

function injectStyles(tag, css) {
  if (injectedStyles.has(tag)) return;
  injectedStyles.add(tag);
  const style = document.createElement("style");
  let scoped = `${tag} { display: block; }\n`;
  scoped += css.replace(/([^{}]+)\{/g, (match, selector) => {
    const trimmed = selector.trim();
    if (trimmed.startsWith("@")) return match;
    const scopedSel = trimmed
      .split(",")
      .map((s) => `${tag} ${s.trim()}`)
      .join(", ");
    return `${scopedSel} {`;
  });
  style.textContent = scoped;
  document.head.appendChild(style);
}

// ─── Intersection Observer — lazy mount ─────────────────────────────────────

const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        mountComponent(entry.target);
        lazyObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "100px" },
);

// ─── Router ─────────────────────────────────────────────────────────────────

const routes = new Map();
let routerOutlet = null;
let currentRoute = null;
let routerDisposers = [];
let routerUseHash = false;

function canUseHistoryRouting() {
  return typeof window !== "undefined" && window.location.protocol !== "file:";
}

function normalizeRoutePath(path) {
  if (path === "*") return "*";
  if (!path) return "/";
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

function getCurrentRoutePath() {
  if (routerUseHash) {
    const hash = window.location.hash || "#/";
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    return normalizeRoutePath(raw || "/");
  }
  return normalizeRoutePath(window.location.pathname);
}

function registerRouterEvent(target, eventName, handler, options = false) {
  target.addEventListener(eventName, handler, options);
  routerDisposers.push(() =>
    target.removeEventListener(eventName, handler, options),
  );
}

function disposeRouterEvents() {
  for (let i = 0; i < routerDisposers.length; i++) {
    routerDisposers[i]();
  }
  routerDisposers = [];
}

export function route(path, componentTag, loader) {
  routes.set(normalizeRoutePath(path), { componentTag, loader });
  if (loader) defineComponent(componentTag, loader);
}

export function initRouter(outletSelector = "#app", options = {}) {
  disposeRouterEvents();
  const requestedMode = options.mode === "hash" ? "hash" : "history";
  routerUseHash =
    requestedMode === "hash" ? true : !canUseHistoryRouting();
  routerOutlet = document.querySelector(outletSelector);
  if (!routerOutlet) return;
  registerRouterEvent(window, routerUseHash ? "hashchange" : "popstate", () =>
    resolveRoute(),
  );
  registerRouterEvent(
    document,
    "click",
    (e) => {
      // Let browser handle modified clicks (new tab/window, etc.)
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const origin =
        e.target instanceof Element ? e.target : e.target?.parentElement;
      const a = origin?.closest?.("[nano-link]");
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      e.preventDefault();
      const target = normalizeRoutePath(
        a.getAttribute("nano-link") || a.getAttribute("href") || "/",
      );
      if (routerUseHash) {
        window.location.hash = `#${target}`;
      } else {
        history.pushState(null, "", target);
      }
      resolveRoute();
    },
    true,
  );
  if (routerUseHash && !window.location.hash) {
    window.location.hash = "#/";
  }
  resolveRoute();
}

async function resolveRoute() {
  const path = getCurrentRoutePath();
  const match = routes.get(path) || routes.get("*");
  if (!match || match.componentTag === currentRoute) return;
  currentRoute = match.componentTag;
  routerOutlet.innerHTML = `<${match.componentTag}></${match.componentTag}>`;
  await mountComponent(routerOutlet.firstElementChild);
}

// ─── Boot ────────────────────────────────────────────────────────────────────

export function boot() {
  const scan = (root) => {
    registry.forEach((_, tag) => {
      root.querySelectorAll(tag).forEach((el) => {
        if (el.getAttribute("nano-state")) return;
        el.setAttribute("nano-state", "pending");
        el.hasAttribute("lazy") ? lazyObserver.observe(el) : mountComponent(el);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scan(document));
  } else {
    scan(document);
  }

  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) =>
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        scan(node);
      }),
    );
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// Event handling
const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

const disposeNodes = async (node) => {
  // let domList = domListIterator(node);

  // for (let i = domList.length - 1; i > -1; i--) {
  //   eventListenerInst.unregisterEventListener(domList[i]);
  //   // domList[i] = null;

  //   if (i % 50 === 0) {
  //     await yieldToMain();
  //   }
  // }

  // domList = node = null;

  // new

  // Use iteration instead of recursion
  const nodeStack = [node];

  while (nodeStack.length > 0) {
    let current = nodeStack.pop();

    if (!current) continue;

    // if (
    //   current.getAttribute &&
    //   current.getAttribute("ignorenode") === "true"
    // ) {
    //   continue;
    // }

    // Clean up event listeners
    // eventListenerInst.unregisterEventListener(current);
    if (current && current._events) {
      for (const evt in current._events) {
        const handlers = current._events[evt];
        if (Array.isArray(handlers)) {
          for (let i = 0; i < handlers.length; i++) {
            current.removeEventListener(evt, handlers[i], true);
          }
        } else if (typeof handlers === "function") {
          current.removeEventListener(evt, handlers, true);
        }
      }
      current._events = null;
      current.__onSubmit = null;
    }

    // Add children to stack
    if (current.childNodes) {
      for (let i = current.childNodes.length - 1; i >= 0; i--) {
        nodeStack.push(current.childNodes[i]);
        if (i % 50 === 0) {
          await yieldToMain();
        }
      }
    }

    // Clear references
    // current.nodeValue = null;
    current?.remove?.();

    current = null;
  }

  // Clear final references

  node = null;
  nodeStack.length = 0;

  // end
};

export default {
  signal,
  computed,
  effect,
  defineComponent,
  route,
  initRouter,
  boot,
};
