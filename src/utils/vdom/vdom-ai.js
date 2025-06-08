// Use WeakMap for event listeners (no DOM pollution)
const listenersMap = new WeakMap();

function addListener(el, event, handler) {
  el.addEventListener(event, handler);
  let map = listenersMap.get(el) || {};
  map[event] = handler;
  listenersMap.set(el, map);
}

function removeListeners(el) {
  const map = listenersMap.get(el);
  if (map) {
    for (const event in map) {
      el.removeEventListener(event, map[event]);
    }
    listenersMap.delete(el);
  }
}

function createFragement(obj) {
  // console.log(a, b, c);
  // return document.createDocumentFragment().append(children);
  // return obj.children.forEach((child) => {
  //   return createDomElement(child.type, child.props, ...child.children);
  // });
  const fragment = document.createDocumentFragment();
  fragment.append(...obj.children);
  return fragment;
}

const MyUILib = (() => {
  /**
   * Creates a real DOM node from a component or element description.
   * @param {string|Function} type - Tag name or component function.
   * @param {Object} props - Props/attributes.
   * @param {...any} children - Child elements or text.
   * @returns {HTMLElement|Text}
   */
  function createDomElement(type, props = {}, ...children) {
    // If type is a function, treat as a component
    if (typeof type === "function") {
      return type({ ...props, children });
    }
    // If type is a string, create an element
    const el = document.createElement(type);

    // Set attributes and event listeners
    updateProps(props, el);
    // Append children
    children.flat().forEach((child) => {
      if (child == null) return;
      if (typeof child === "string" || typeof child === "number") {
        el.appendChild(document.createTextNode(child));
      } else if (
        child === null ||
        child === undefined ||
        child === true ||
        child === false
      ) {
      } else if (Array.isArray(child)) {
        child.forEach((c) =>
          el.appendChild(
            typeof c === "string" || typeof c === "number"
              ? document.createTextNode(c)
              : c
          )
        );
      } else {
        el?.appendChild(child);
      }
    });
    return el;
  }

  /**
   * Removes all event listeners from a DOM node and its children.
   * @param {HTMLElement} node
   */
  function removeAllEventListeners(node) {
    // Call unmount callback if present
    if (typeof node._unmountCallback === "function") {
      node._unmountCallback(node);
    }
    removeListeners(node);
    if (node && node.childNodes) {
      node.childNodes.forEach((child) => removeAllEventListeners(child));
    }
  }

  /**
   * Renders a component or element tree into a container.
   * @param {HTMLElement|Text} node - The root node to render.
   * @param {HTMLElement} container - The DOM container.
   */
  function render(node, container) {
    container.childNodes.forEach((child) => removeAllEventListeners(child));
    container.innerHTML = "";
    container.appendChild(node);
    return node;
  }

  function applyPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();

      switch (patch.op) {
        case "APPEND":
          patch.p.appendChild(patch.c);
          if (typeof patch.c._mountCallback === "function") {
            setTimeout(() => {
              patch.c._mountCallback(patch.c);
              patch.c = null; // Clear reference
            }, 0);
          }
          // patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "INSERT_BEFORE":
          patch.p.insertBefore(patch.c, patch.ref);
          if (typeof patch.c._mountCallback === "function") {
            setTimeout(() => {
              patch.c._mountCallback(patch.c);
              patch.c = null; // Clear reference
            }, 0);
          }
          // patch.c = null;
          patch.p = null;
          patch.ref = null;
          patch.op = null;
          break;
        case "INSERT_AFTER":
          if (patch.ref && patch.ref.nextSibling) {
            patch.p.insertBefore(patch.c, patch.ref.nextSibling);
          } else {
            patch.p.appendChild(patch.c);
          }
          if (typeof patch.c._mountCallback === "function") {
            setTimeout(() => {
              patch.c._mountCallback(patch.c);
              patch.c = null; // Clear reference
            }, 0);
          }
          patch.c = null;
          patch.p = null;
          patch.ref = null;
          patch.op = null;
          break;
        case "REMOVE":
          removeAllEventListeners(patch.c);
          patch.p.removeChild(patch.c);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "REPLACE":
          removeAllEventListeners(patch.c[1]);
          patch.p.replaceChild(patch.c[0], patch.c[1]);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "CONTENT":
          patch.p.textContent = patch.c;
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
      }
    }
  }

  function applyPropsPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();
      // updateProps(patch.$target, patch.newProps, patch.oldProps);
      updateProps(patch.newProps, patch.$target);

      patch.$target = null;
      patch.newProps = null;
      patch.oldProps = null;
    }
  }

  return {
    createDomElement,
    createFragement,
    render,
    applyPatches,
    applyPropsPatches,
    removeAllEventListeners,
  };
})();

export default MyUILib;
export const { createDomElement, render, applyPatches, applyPropsPatches } =
  MyUILib;

function updateProps(props, el) {
  for (const key in props) {
    if (key === "children") continue;
    else if (key === "onMount" && typeof props[key] === "function") {
      // Call mount callback after element is added to DOM
      // setTimeout(() => props[key](el), 0);
      el._mountCallback = props[key];
      setTimeout(() => {
        if (document.body.contains(el)) {
          props[key](el);
        }
      }, 0);
    } else if (key === "onUnmount" && typeof props[key] === "function") {
      // Store unmount callback for later use (e.g., in removeAllEventListeners)
      el._unmountCallback = props[key];
    }
    if (key.startsWith("on") && typeof props[key] === "function") {
      const eventName = key.slice(2).toLowerCase();
      // Remove old listener if exists
      removeListeners(el);
      addListener(el, eventName, props[key]);
    } else if (key === "className") {
      el.setAttribute("class", props[key]);
    } else if (key === "style" && typeof props[key] === "object") {
      Object.assign(el.style, props[key]);
    } else if (props[key] === true) {
      el.setAttribute(key, "");
    } else if (props[key] === false) {
      el.removeAttribute(key);
    } else if (key === "ref" && typeof props[key] === "function") {
      // Handle ref callback
      props[key](el);
    } else {
      el.setAttribute(key, props[key]);
    }
  }
}

function createStateManager(initialState = {}) {
  let state = initialState;
  const listeners = new Set();

  function get() {
    return state;
  }

  function set(newState) {
    // Accommodate plain values (non-object)
    if (
      typeof state !== "object" ||
      state === null ||
      typeof newState !== "object" ||
      newState === null
    ) {
      state = newState;
    } else {
      state = { ...state, ...newState };
    }
    notifyListeners();
  }

  function subscribe(listener, compareFn = (prev, next) => prev !== next) {
    const subscription = { listener, compareFn, prevState: state };
    listeners.add(subscription);
    return () => unsubscribe(subscription);
  }

  function unsubscribe(subscription) {
    listeners.delete(subscription);
  }

  function notifyListeners() {
    listeners.forEach((subscription) => {
      if (subscription.compareFn(subscription.prevState, state)) {
        subscription.listener(state);
        subscription.prevState = state;
      }
    });
  }

  function cleanup() {
    listeners.clear();
    state =
      typeof initialState === "object" && initialState !== null
        ? {}
        : undefined;
  }

  const api = {
    set,
    subscribe,
    cleanup,
  };

  return [get, api];
}

export { createStateManager };

// Example usage:
// const stateManager = createStateManager({ name: 'John', age: 30 });

// // Subscribe to state changes
// const unsubscribe = stateManager.subscribe((state) => {
//   console.log('State changed:', state);
// });

// // Update state
// stateManager.setState({ age: 31 });

// // Unsubscribe
// unsubscribe();

// // Update state again
// stateManager.setState({ name: 'Jane' });

// // Cleanup
// stateManager.cleanup();

// Simple Router
export class SimpleRouter {
  constructor(routes) {
    this.routes = routes; // { "/": () => ..., "/about": () => ... }
    this.root = null;
    this.handlePopState = this.handlePopState.bind(this);
  }

  mount(root) {
    this.root = root;
    window.addEventListener("popstate", this.handlePopState);
    this.navigate(window.location.pathname, false);
  }

  unmount() {
    window.removeEventListener("popstate", this.handlePopState);
    this.root = null;
  }

  handlePopState() {
    this.navigate(window.location.pathname, false);
  }

  cleanup() {
    if (this.root) {
      // Proper cleanup using applyPatches to remove old nodes
      const patches = [];
      Array.from(this.root.childNodes).forEach((child) => {
        patches.push({ op: "REMOVE", p: this.root, c: child });
      });
      MyUILib.applyPatches(patches);
    }
  }

  navigate(path, pushState = true) {
    if (pushState) window.history.pushState({}, "", path);
    if (this.routes[path]) {
      // Proper cleanup using applyPatches to remove old nodes
      this.cleanup();
      const node = this.routes[path]();
      if (node) this.root.appendChild(node);
    } else {
      // this.root.innerHTML = "<h2>404 Not Found</h2>";
      const notFoundHandler = this.routes["404"];
      if (notFoundHandler) {
        // Proper cleanup using applyPatches to remove old nodes
        this.cleanup();
        // Call the notFound handler to get the 404 node
        // and append it to the root
        const node = notFoundHandler();
        if (node) this.root.appendChild(node);
      }
    }
  }

  linkHandler(event) {
    if (
      event.target.tagName === "A" &&
      event.target.hasAttribute("data-router-link")
    ) {
      event.preventDefault();
      this.navigate(event.target.getAttribute("href"));
    }
  }
}
