const IS_PROD = false; // typeof window !== "undefined" ? import.meta.env.PROD : false;

const noop = () => {};
const log = IS_PROD ? noop : console.log;
const logt = IS_PROD ? noop : console.time,
  logte = IS_PROD ? noop : console.timeEnd;

const normalizeChildren = (children) => {
  const flatChildren = [];

  const walk = (child) => {
    if (child == null) return;

    if (Array.isArray(child)) {
      for (const nestedChild of child) walk(nestedChild);
      return;
    }

    flatChildren.push(child);
  };

  for (const child of children) walk(child);

  return flatChildren;
};

export const h = (type, props, ...children) => {
  const normalizedChildren = normalizeChildren(children);

  if (typeof type === "function") {
    return type(props || {}, normalizedChildren);
  }

  return {
    type,
    props: props || {},
    key: props?.key,
    children: normalizedChildren,
  };
};

export const ReactiveText = (props) => {
  let element = null;

  // Set up the effect to update the text content directly
  const clean = effect(() => {
    // Read the reactive signal value first to register the dependency
    const rawValue = props.value();

    // Safely mutate the DOM node if it is currently mounted
    if (element) {
      element.textContent = props.textContent
        ? props.textContent(rawValue)
        : rawValue;
    }
  });

  return h(
    props.type,
    {
      ...props.elementProps,
      ref: (el) => {
        element = el;
        if (props.elementProps?.ref) props.elementProps.ref(el);
      },
      onUnmount: () => {
        clean();
        props.value?.dispose?.();
        element = null;

        if (props.elementProps?.onUnmount) props.elementProps.onUnmount();
      },
    },
    [`${props.textContent ? props.textContent(props.value()) : props.value()}`],
  );
};

const COMMENT_NODE_TYPE = "_ForMark_";

function withKey(vnode, key) {
  if (vnode == null || typeof vnode !== "object") return vnode;
  if (vnode.key === key) return vnode;

  const props = vnode.props ? { ...vnode.props } : {};
  props.key = key;

  return {
    ...vnode,
    key,
    props,
  };
}

function getListRefNode(parent, startAnchor, endAnchor, index) {
  let current = startAnchor?.nextSibling || null;
  let i = 0;

  while (current && current !== endAnchor && i < index) {
    current = current.nextSibling;
    i++;
  }

  return current === endAnchor ? endAnchor : current;
}

export function For(props, children) {
  const renderItem =
    props.render || (typeof children?.[0] === "function" ? children[0] : null);

  const getItems =
    typeof props.each === "function" ? props.each : () => props.each || [];

  const getKey =
    typeof props.keyBy === "function"
      ? props.keyBy
      : (item, index) => item?.key ?? item?.id ?? index;

  const resolveParent = () =>
    typeof props.parent === "function" ? props.parent() : props.parent;

  let currParent = null; // mainly used for remove alll opti
  let startAnchor = null;
  let endAnchor = null;
  let prevChildren = [];
  let disposed = false;
  let initialSyncQueued = false;

  const scheduleInitialSync = () => {
    if (disposed || initialSyncQueued) return;
    initialSyncQueued = true;

    const run = () => {
      initialSyncQueued = false;
      sync();
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(run);
    } else {
      Promise.resolve().then(run);
    }
  };

  const sync = () => {
    if (disposed || !startAnchor || !endAnchor) return;

    const parent =
      resolveParent() || startAnchor.parentNode || endAnchor.parentNode;
    if (!parent) return;

    const items = getItems() || [];
    const nextChildren = items.map((item, index) => {
      const rendered = renderItem ? renderItem(item, index) : item;
      const vnode =
        rendered == null || typeof rendered !== "object"
          ? {
              $c: true,
              value: rendered,
              props: { value: rendered },
              children: [],
            }
          : rendered;

      return withKey(vnode, getKey(item, index));
    });

    // optimization
    const { patches, splOp } = diffKeyedChildren(
      parent,
      prevChildren,
      nextChildren,
    );

    // 1. all new
    if (splOp === "ADDALL" && nextChildren.length > 0) {
      const fragment = document.createDocumentFragment();

      for (const child of nextChildren) {
        fragment.appendChild(createElement(child));
      }

      parent.insertBefore(fragment, endAnchor);
      prevChildren = nextChildren;
      // props?.updateParentRef?.(parent);
      currParent = parent;
      return;
    }

    // 2. Remove all
    if (splOp === "REMOVEALL-FAST") {
      addPatches([
        {
          op: splOp,
          p: parent,
          ref: (el) => {
            props?.updateParentRef?.(el);
            currParent = el;
          },
        },
      ]);
      prevChildren = nextChildren;

      setTimeout(() => {
        currParent.appendChild(
          createElement(
            For(
              {
                ...props,
                parent: currParent,
              },
              children,
            ),
          ),
        );
      }, 0);

      return;
    }

    for (const patch of patches) {
      patch.p = parent;

      if (patch.op === "ADD") {
        patch.refNode = getListRefNode(
          parent,
          startAnchor,
          endAnchor,
          patch.index,
        );
      } else if (patch.op === "MOVE") {
        patch.refNode = patch.refKey
          ? parent.querySelector(`:scope > [key="${patch.refKey}"]`)
          : endAnchor;
      } else if (patch.op === "REMOVE" || patch.op === "PATCH") {
        patch.c = parent.querySelector(`:scope > [key="${patch.key}"]`);
      }
    }

    prevChildren = nextChildren;
    addPatches(patches);
  };

  const stop = effect(() => {
    getItems();
    sync();
  });

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    stop?.();
    startAnchor = null;
    endAnchor = null;
    prevChildren = [];
  };

  return h(
    "df",
    {},
    h(COMMENT_NODE_TYPE, {
      ref: (el) => {
        startAnchor = el;
      },
      onUnmount: cleanup,
    }),
    h(COMMENT_NODE_TYPE, {
      ref: (el) => {
        endAnchor = el;
        scheduleInitialSync();
      },
      onUnmount: cleanup,
    }),
  );
}

export function diffKeyedChildren(container, oldChildren, newChildren) {
  const patches = [];

  // optimization
  // if all new
  if (oldChildren.length === 0) {
    newChildren.forEach((node, index) =>
      patches.push({ op: "ADD", c: node, index }),
    );
    // return patches;
    return { splOp: "ADDALL", patches };
  }

  // all gone
  if (newChildren.length === 0) {
    // oldChildren.forEach((node) =>
    //   patches.push({ op: "REMOVE", key: node.key ?? getUnkeyedId(node) }),
    // );
    // return patches;
    return { splOp: "REMOVEALL-FAST", patches };
  }

  // Index old children
  const oldKeyedMap = new Map();
  const oldUnkeyed = [];
  for (const [i, node] of oldChildren.entries()) {
    node.key != null
      ? oldKeyedMap.set(node.key, { node, originalPos: i })
      : oldUnkeyed.push({ node, originalPos: i });
  }

  // ── Pass 1: resolve each new child to its old position ───────────────────
  // newMapped[i] = { newChild, oldPos } or null if it's a fresh ADD
  let unkeyedCursor = 0;
  const newMapped = newChildren.map((newChild) => {
    if (newChild.key != null) {
      const old = oldKeyedMap.get(newChild.key);
      if (old) {
        oldKeyedMap.delete(newChild.key);
        if (!shallowEqual(old.node, newChild))
          patches.push({
            op: "PATCH",
            key: newChild.key,
            prev: old.node,
            next: newChild,
          });
        return { newChild, oldPos: old.originalPos };
      }
    } else {
      const oldEntry = oldUnkeyed[unkeyedCursor];
      if (oldEntry) {
        unkeyedCursor++;
        if (!shallowEqual(oldEntry.node, newChild))
          patches.push({
            op: "PATCH",
            key: getUnkeyedId(oldEntry.node),
            prev: oldEntry.node,
            next: newChild,
          });
        return { newChild, oldPos: oldEntry.originalPos };
      }
    }
    // No match — will be ADDed
    patches.push({
      op: "ADD",
      c: newChild,
      index: newChildren.indexOf(newChild),
    });
    return null;
  });

  // ── Pass 2: LIS over oldPos values of matched nodes ──────────────────────
  // Nodes in the LIS are already in the right relative order → don't move them.
  // Every other matched node needs a MOVE.

  const matched = newMapped
    .map((m, newIdx) => (m ? { ...m, newIdx } : null))
    .filter(Boolean);

  if (matched.length) {
    const lisIndices = new Set(computeLIS(matched.map((m) => m.oldPos)));

    for (let i = 0; i < matched.length; i++) {
      if (!lisIndices.has(i)) {
        const { newChild, newIdx } = matched[i];
        const key = newChild.key ?? getUnkeyedId(newChild);
        const refKey = newChildren[newIdx + 1]?.key ?? null; // null = move to end
        patches.push({ op: "MOVE", key, refKey });
      }
    }
  }

  // ── Pass 3: removals ─────────────────────────────────────────────────────
  for (const [key] of oldKeyedMap) patches.push({ op: "REMOVE", key });
  for (let i = unkeyedCursor; i < oldUnkeyed.length; i++)
    patches.push({ op: "REMOVE", key: getUnkeyedId(oldUnkeyed[i].node) });

  return { patches, splOp: null };
}

// patience-sort LIS — O(n log n), returns indices into `seq` that form the LIS
function computeLIS(seq) {
  const tails = []; // tails[i] = smallest tail value of IS of length i+1
  const tailIdx = []; // index in seq of each tail
  const prev = new Array(seq.length).fill(-1);
  const posMap = []; // posMap[i] = index in tails where seq[i] was placed

  for (let i = 0; i < seq.length; i++) {
    const val = seq[i];
    let lo = 0,
      hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      tails[mid] < val ? (lo = mid + 1) : (hi = mid);
    }
    tails[lo] = val;
    tailIdx[lo] = i;
    posMap[i] = lo;
    if (lo > 0) prev[i] = tailIdx[lo - 1];
  }

  // Backtrack to recover the actual indices
  const result = new Set();
  let idx = tailIdx[tails.length - 1];
  while (idx !== -1) {
    result.add(idx);
    idx = prev[idx];
  }
  return result;
}

// // ── helpers ──────────────────────────────────────────────────────────────────

// /**
//  * Cheap structural comparison of two VNodes.
//  * Returns true when type and all top-level props are equal (no deep diff).
//  */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (a.type !== b.type) return false;
  const ap = a.props ?? {};
  const bp = b.props ?? {};
  const aKeys = Object.keys(ap);
  const bKeys = Object.keys(bp);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => ap[k] === bp[k]);
}

/**
 * Stable synthetic identifier for an unkeyed VNode.
 * Uses an WeakMap so the same object always gets the same id,
 * and the mapping is GC-friendly.
 */
const unkeyedIds = new WeakMap();
let unkeyedCounter = 0;
function getUnkeyedId(node) {
  if (!unkeyedIds.has(node)) {
    unkeyedIds.set(node, `__unkeyed_${unkeyedCounter++}`);
  }
  return unkeyedIds.get(node);
}

// all dom related functions
let dom = {};
import { signal, effect } from "@simple-signal";
if (typeof window !== "undefined") {
  const _dom = () => {
    const _bubblesCache = new Map();
    function isNonBubblingEvent(eventName) {
      if (!_bubblesCache.has(eventName)) {
        _bubblesCache.set(eventName, new Event(eventName).bubbles);
      }
      return !_bubblesCache.get(eventName); // true = non-bubbling
    }

    function ensureGlobalListener(eventName) {
      if (!_bubblesCache.has(eventName)) {
        _bubblesCache.set(eventName, new Event(eventName).bubbles);
      }
      if (
        _bubblesCache.get(eventName) &&
        !_registeredGlobalEvents.has(eventName)
      ) {
        rootNode.addEventListener(eventName, globalEventListener, false);
        _registeredGlobalEvents.add(eventName);
      }
    }
    const _registeredGlobalEvents = new Set();

    // mount n unmount
    let mountFns = [];

    function callUnmountAll() {
      const keysToReset = [];

      for (const key in altFuncCache) {
        if (!funcCache[key]) {
          altFuncCache[key].unMount?.();
          altFuncCache[key].unMount = null;

          delete altFuncCache[key];

          // reset(key);
          keysToReset.push(key);
        }
      }
      reset(keysToReset);
    }

    function callMountAll() {
      while (mountFns?.length) {
        // log(mountFns.pop());
        mountFns.pop()();
      }

      // if (len)
      init();
    }
    // dom helpers
    let rootNode = null;
    let curr = null;
    let old = null;

    // Tracks the element currently being dragged.
    // Set on pointerdown (earliest possible signal) so any forceUpdate
    // triggered by subsequent events already sees it.
    let _draggingEl = null;
    let _activeDrag = false;

    function registerDragListeners() {
      // pointerdown arms _draggingEl before any state change can schedule
      // a forceUpdate — dragstart fires too late for that.
      rootNode.addEventListener(
        "pointerdown",
        (e) => {
          const draggable =
            e.target.closest?.("[draggable='true']") ??
            (e.target.draggable ? e.target : null);
          if (draggable) _draggingEl = draggable;
        },
        true,
      );

      // dragstart confirms a real drag session began.
      rootNode.addEventListener(
        "dragstart",
        (e) => {
          _draggingEl = e.target;
          _activeDrag = true;
        },
        true,
      );

      // dragend: clear and settle final DOM state.
      rootNode.addEventListener(
        "dragend",
        () => {
          _draggingEl = null;
          _activeDrag = false;
          forceUpdate();
        },
        true,
      );

      // pointerup/cancel: clear if dragstart never fired (plain click).
      const clearIfNotDragging = () => {
        requestAnimationFrame(() => {
          if (_draggingEl && !_activeDrag) _draggingEl = null;
        });
      };
      rootNode.addEventListener("pointerup", clearIfNotDragging, true);
      rootNode.addEventListener("pointercancel", clearIfNotDragging, true);
    }

    function registerElementEffect($target, dispose) {
      if (!$target || typeof dispose !== "function") return dispose;

      if (!$target.__effects) {
        $target.__effects = [];
      }

      $target.__effects.push(dispose);
      return dispose;
    }

    function cleanupElementEffects($target) {
      const effects = $target?.__effects;
      if (!effects || effects.length === 0) return;

      for (const dispose of effects) {
        dispose?.();
      }

      $target.__effects = null;
    }

    function applyStyleObject($target, nextStyle, prevStyle = {}) {
      const resolvedStyle = nextStyle || {};

      for (const sk in prevStyle) {
        if (!(sk in resolvedStyle)) {
          $target.style[sk] = "";
        }
      }

      for (const sk in resolvedStyle) {
        $target.style[sk] = resolvedStyle[sk];
      }
    }

    function setBooleanProp($target, name, value) {
      if (value) {
        $target.setAttribute(name, value);
        $target[name] = true;
      } else {
        removeBooleanProp($target, name);
        $target[name] = false;
      }
    }

    function removeBooleanProp($target, name) {
      $target.removeAttribute(name);
      $target[name] = false;
    }

    function isEventProp(name) {
      return /^on[A-Z]/.test(name);
    }

    function extractEventName(name) {
      return name.slice(2).toLowerCase();
    }

    function isCustomProp(name) {
      return (
        isEventProp(name) || name === "fragChildLen"
        // name === "ignoreNode" ||
        // name === "fallback" ||
        // name === "importFn" ||
        // name === "error"
      );
    }

    function setProp($target, name, value) {
      // log(name, value);
      const registerSourceDisposal = () => {
        if (typeof value?.dispose === "function") {
          registerElementEffect($target, value.dispose);
        }
      };

      if (isCustomProp(name)) {
        if (isEventProp(name)) {
          const extratedName = extractEventName(name);
          const isNonBubbling = isNonBubblingEvent(extratedName);
          // For bubbling events, store handler reference for global listener
          if (!isNonBubbling) {
            $target[`__${name}`] = value;
          }
        }
      } else if (name === "className") {
        if (typeof value === "function") {
          registerElementEffect(
            $target,
            effect(() => {
              const v = value();
              $target.setAttribute("class", v);
            }),
          );
          registerSourceDisposal();
        } else {
          $target.setAttribute("class", value);
        }
      } else if (name === "style") {
        if (typeof value === "function") {
          let prevStyle = {};

          registerElementEffect(
            $target,
            effect(() => {
              const nextStyle = value() || {};
              applyStyleObject($target, nextStyle, prevStyle);
              prevStyle = nextStyle;
            }),
          );
          registerSourceDisposal();
        } else {
          applyStyleObject($target, value);
        }
      } else if (name === "ref") {
        value?.($target);
      } else if (name === "ignoreLater") {
        // $target["ignorenode"] = true;
        $target.setAttribute("ignorenode", true);
        $target.removeAttribute(name.toLowerCase());
      } else if (typeof value === "boolean") {
        if (typeof value === "function") {
          registerElementEffect(
            $target,
            effect(() => {
              const v = value();
              setBooleanProp($target, name, v);
            }),
          );
          registerSourceDisposal();
        } else {
          setBooleanProp($target, name, value);
        }
      } else {
        if (name === "value" || name === "htmlFor") {
          // special case
          if (typeof value === "function") {
            registerElementEffect(
              $target,
              effect(() => {
                const v = value();
                $target[name] = v;
              }),
            );
            registerSourceDisposal();
            return;
          } else {
            $target[name] = value;
            return;
          }

          // special handling for select
          const sid = setTimeout(() => {
            clearTimeout(sid);
            if (typeof value === "function") {
              effect(() => {
                const v = value();
                $target[name] = v;
              });
            } else {
              $target[name] = value;
            }
          }, 0);
        } else {
          if (typeof value === "function") {
            registerElementEffect(
              $target,
              effect(() => {
                const v = value();
                $target.setAttribute(name, v);
              }),
            );
            registerSourceDisposal();
          } else {
            $target.setAttribute(name, value);
          }
        }
      }
    }

    function removeProp($target, name, value) {
      if (isCustomProp(name)) {
        return;
      } else if (name === "className") {
        $target.removeAttribute("class");
      } else if (name === "style") {
        $target.removeAttribute("style");
        $target.style.cssText = "";
      } else if (typeof value === "boolean") {
        removeBooleanProp($target, name);
      } else {
        $target.removeAttribute(name);
      }
    }

    function setProps($target, props) {
      for (const name in props) {
        setProp($target, name, props[name]);
      }
    }

    function updateProp($target, name, newVal, oldVal) {
      // if (!$target) return;
      if (!newVal && (newVal === undefined || newVal === null)) {
        removeProp($target, name, oldVal);
      } else if (isCustomProp(name)) {
        if (isEventProp(name)) {
          const extratedName = extractEventName(name);
          const isNonBubbling = isNonBubblingEvent(extratedName);

          if (isNonBubbling) {
            // Non-bubbling events: update via addEventListeners
            if ($target._events && $target._events[`${extratedName}`]) {
              $target.removeEventListener(
                extratedName,
                $target._events[`${extratedName}`],
                false,
              );
            }
            addEventListeners($target, { [name]: newVal });
          } else {
            // Bubbling events: update handler reference
            $target[`__${name}`] = newVal;
          }
        }
      } else if (!oldVal || newVal !== oldVal) {
        setProp($target, name, newVal);
      }
    }

    function updateProps($target, newProps, oldProps = {}) {
      // if (newProps.ignoreNode || newProps.ignoreLater) {
      //   console.log($target, newProps);
      // }
      const props = Object.assign({}, newProps, oldProps);
      for (const name in props) {
        if (isEventProp(name)) {
          const extratedName = extractEventName(name);
          const isNonBubbling = isNonBubblingEvent(extratedName);

          if (isNonBubbling) {
            // Non-bubbling events: update directly
            updateProp($target, name, newProps[name], oldProps[name]);
          } else {
            // Bubbling events: store on element for global handler
            $target[`__${name}`] = newProps[name];
            // Reqd for SSR case
            const eventLowerCase = extratedName;
            if ($target.getAttribute(eventLowerCase) !== null)
              $target.removeAttribute(eventLowerCase);
          }
        } else {
          updateProp($target, name, newProps[name], oldProps[name]);
        }
      }
    }

    // function patchChildren($parent, prevChildren = [], nextChildren = []) {
    //   const prevLen = prevChildren.length;
    //   const nextLen = nextChildren.length;
    //   const maxLen = Math.max(prevLen, nextLen);

    //   for (let i = 0; i < maxLen; i++) {
    //     const prevChild = prevChildren[i];
    //     const nextChild = nextChildren[i];
    //     const domChild = $parent.childNodes[i];

    //     if (nextChild == null) {
    //       if (domChild) {
    //         void disposeNodes(domChild);
    //       }
    //       continue;
    //     }

    //     if (prevChild == null) {
    //       $parent.insertBefore(createElement(nextChild), domChild || null);
    //       continue;
    //     }

    //     const prevIsNode = prevChild && typeof prevChild === "object";
    //     const nextIsNode = nextChild && typeof nextChild === "object";

    //     if (!prevIsNode || !nextIsNode) {
    //       if (prevChild !== nextChild) {
    //         if (domChild?.nodeType === 3) {
    //           domChild.textContent = nextChild ?? "";
    //         } else {
    //           const replacement = createElement(nextChild);
    //           if (domChild) {
    //             $parent.replaceChild(replacement, domChild);
    //             void disposeNodes(domChild);
    //           } else {
    //             $parent.appendChild(replacement);
    //           }
    //         }
    //       }
    //       continue;
    //     }

    //     patchNode(domChild, prevChild, nextChild);
    //   }
    // }

    // function patchNode($target, prevVNode, nextVNode) {
    //   if (!$target || !prevVNode || !nextVNode) return $target;

    //   if (prevVNode.type !== nextVNode.type) {
    //     const replacement = createElement(nextVNode);
    //     $target.replaceWith(replacement);
    //     void disposeNodes($target);
    //     return replacement;
    //   }

    //   if (!nextVNode.type) {
    //     const nextValue =
    //       nextVNode?.value ?? nextVNode?.children?.[0] ?? nextVNode ?? "";
    //     if ($target.textContent !== `${nextValue ?? ""}`) {
    //       $target.textContent = nextValue ?? "";
    //     }
    //     return $target;
    //   }

    //   if (nextVNode.type === "df") {
    //     patchChildren(
    //       $target,
    //       prevVNode.children || [],
    //       nextVNode.children || [],
    //     );
    //     return $target;
    //   }

    //   updateProps($target, nextVNode.props, prevVNode.props);
    //   patchChildren(
    //     $target,
    //     prevVNode.children || [],
    //     nextVNode.children || [],
    //   );

    //   return $target;
    // }

    function addEventListeners($target, props) {
      for (const name in props) {
        if (name === "onMount") {
          continue;
        }
        if (isEventProp(name)) {
          const extractedName = extractEventName(name);
          const isNonBubbling = isNonBubblingEvent(extractedName);

          if (!$target._events) $target._events = {};

          if (isNonBubbling) {
            // Direct binding — same as before
            if ($target._events[extractedName]) {
              $target.removeEventListener(
                extractedName,
                $target._events[extractedName],
                false,
              );
            }
            $target._events[extractedName] = props[name];
            $target.addEventListener(extractedName, props[name], false);
          } else {
            // ✅ Register global listener lazily — no hardcoded list needed
            ensureGlobalListener(extractedName);
            $target[`__${name}`] = props[name];
          }
        }
      }
    }

    // vdom to dom

    const $d = document;
    // SVG

    const $sns = "http://www.w3.org/2000/svg";

    const createAndAppendSVG = (tag, attrs, ...children) => {
      function setPropsNS($target, props) {
        for (const name in props) {
          // setProp($target, name, props[name]);
          $target.setAttributeNS(null, name, props[name]);
        }
      }

      const element = $d.createElementNS($sns, "svg");
      // addAttributes(element, attrs);

      setPropsNS(element, attrs);

      for (const child of children) {
        const childElement = $d.createElementNS($sns, child.type);

        setPropsNS(childElement, child.props);

        // appendChild(element, childElement);
        element.appendChild(childElement);
      }

      return element;
    };

    // end SVG

    // Use requestIdleCallback to avoid blocking the main thread for large children arrays
    const appendChildren = (children, parent) => {
      let i = 0;
      const len = children.length;

      function processChunk(deadline) {
        const fragment = document.createDocumentFragment();
        while (i < len && deadline.timeRemaining() > 1) {
          fragment.appendChild(createElement(children[i]));
          i++;
        }
        if (fragment.childNodes.length > 0) {
          parent.appendChild(fragment);
        }
        if (i < len) {
          requestIdleCallback(processChunk);
        }
      }

      requestIdleCallback(processChunk);
    };

    function createElement(node) {
      if (Array.isArray(node)) {
        const fragment = $d.createDocumentFragment();

        for (let i = 0, len = node.length; i < len; ++i) {
          fragment.appendChild(createElement(node[i]));
        }

        return fragment;
      }

      if (!node?.type) {
        if (node?.$c) {
          // const tnode = $d.createTextNode(
          //   node?.value == null || node?.value == undefined ? "" : node?.value
          // );
          // return tnode;
          if (!node.children) {
            const tnode =
              // node?.value == null || node?.value == undefined
              node?.value == null || typeof node?.value === "boolean"
                ? $d.createComment(node.value)
                : $d.createTextNode(node?.value);
            return tnode;
          } else {
            return createElement(node.children[0]);
          }
        } else
          return node == null || typeof node === "boolean"
            ? $d.createComment(node)
            : $d.createTextNode(node);
      }

      // only for For compo
      if (node.type === COMMENT_NODE_TYPE) {
        const comment = $d.createComment("");

        if (node.props?.ref) node.props.ref(comment);
        if (node.props?.onMount) node.props.onMount(comment);
        if (node.props?.onUnmount) comment.__onUnmount = node.props.onUnmount;

        return comment;
      }
      // end only for For compo

      //special case Compo with Array return and no type (parent)
      // doc fragement case
      if (node?.type === "df") {
        // console.warn(
        //   "fragment support is experimental and nested fragments NOT supported!!!"
        // );
        const $el2 = $d.createDocumentFragment();

        // node.children.map(createElement).forEach($el2.appendChild.bind($el2));
        if (node.children.length > 100) {
          appendChildren(node.children, $el2);
        } else {
          for (let i = 0, len = node.children.length; i < len; ++i) {
            $el2.appendChild(createElement(node.children[i]));
          }
        }

        return $el2;
      }

      if (node.type === "svg") {
        return createAndAppendSVG(node.type, node.props, ...node.children);
      }

      const $el = $d.createElement(node.type);

      if (!node?.$c) {
        setProps($el, node.props);
        addEventListeners($el, node.props);
        // Ensure all bubbling event handlers are stored on element for global listener
        for (const propName in node.props) {
          if (isEventProp(propName)) {
            const eventName = extractEventName(propName);
            if (!isNonBubblingEvent(eventName)) {
              $el[`__${propName}`] = node.props[propName];
            }
          }
        }
      }

      if (node.children.length > 100) {
        appendChildren(node.children, $el);
      } else {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          $el.appendChild(createElement(node.children[i]));
        }
      }

      // node.children.map(createElement).forEach($el.appendChild.bind($el));

      // log(node.props);
      const mount = node.props?.onMount;

      if (mount) {
        mount && mount($el);
        node.props.onMount = null;

        if (node._events) node._events.mount = null;
      }
      return $el;
    }

    // only 1st type (complete rewrite etc)

    function globalEventListener(e) {
      const eventType = e.type;
      // log(eventType);
      const handlerName = `__on${eventType.charAt(0).toUpperCase()}${eventType.slice(1)}`;

      // Traverse up the DOM tree calling handlers on parent elements
      let currentTarget = e.target;
      while (currentTarget && currentTarget !== rootNode.parentElement) {
        const handler = currentTarget[handlerName];
        if (handler) {
          handler(e);
        }

        // Stop propagation if requested
        if (e.cancelBubble) {
          break;
        }

        currentTarget = currentTarget.parentElement;
      }
    }

    let hydrated = false;

    let patches = [],
      propsPatches = [];

    function addPatches(_patches) {
      patches.push(..._patches);
      // log(patches);

      updateScheduler.schedule();
      // forceUpdate();
    }

    function addPropsPatches(_patches) {
      propsPatches.push(..._patches);
      // log(propsPatches);
      updateScheduler.schedule();
      // forceUpdate();
    }

    // all delta updates
    function forceUpdate() {
      // 2. calculate diff

      if (!IS_PROD) logt("TET");

      // callUnmountAll();

      // 3. update dom
      // console.log(patches);

      if (propsPatches.length) applyPropsPatches(propsPatches);
      if (patches.length) applyPatches(patches);

      patches = [];
      propsPatches = [];

      // patches = propsPatches = null;
      // 3. trigger lifecycle
      // callLifeCycleHooks(callStack, oldStack);

      // callMountAll();

      if (!IS_PROD) logte("TET");
    }

    function isValid(v) {
      return v !== undefined || v !== "";
    }

    // variation impl
    // 1. https://www.youtube.com/watch?v=l2Tu0NqH0qU and https://github.com/Matt-Esch/virtual-dom
    // 2. https://www.youtube.com/watch?v=85gJMUEcnkc

    const navigate = {
      routeChange: false,
      set: (flag) => {
        navigate.routeChange = flag;
      },
    };

    ["popstate", "navigate"].forEach((e) =>
      window.addEventListener(e, () => navigate.set(!0)),
    );

    function applyPropsPatches(_patches) {
      for (let i = 0; i < _patches.length; i++) {
        const patch = _patches[i];

        updateProps(patch.$target, patch.newProps, patch.oldProps);

        patch.$target = null;
        patch.newProps = null;
        patch.oldProps = null;
        // patch = null;
      }
      _patches.length = 0;
    }

    function applyPatches(_patches) {
      const disposalPromises = [];

      for (let i = 0; i < _patches.length; i++) {
        const patch = _patches[i];

        switch (patch.op) {
          case "ADD":
            const refNode =
              patch.refNode ?? patch.p.childNodes[patch.index] ?? null;
            patch.p.insertBefore(createElement(patch.c), refNode);
            break;

          case "APPENDDF":
            patch.p.appendChild(patch.c);
            break;
          case "APPEND": {
            // If the vnode being appended matches the dragged element's key,
            // reuse that exact DOM node instead of creating a new one.
            // A fresh element wouldn't carry the browser's drag context.
            const appendEl =
              _draggingEl &&
              patch.c?.key != null &&
              patch.c.key === _draggingEl.getAttribute?.("key")
                ? _draggingEl
                : createElement(patch.c);
            patch.p.appendChild(appendEl);
            break;
          }
          case "APPEND_CHILDREN": {
            const df = $d.createDocumentFragment();

            for (let i = 0, len = patch.c.length; i < len; ++i) {
              df.appendChild(createElement(patch.c[i]));
            }

            patch.p.appendChild(df);
            break;
          }

          case "REMOVE":
            // Skip disposal if this is the element being dragged — it is
            // moving to another list, not being destroyed. Calling .remove()
            // on it detaches it from the document and breaks the drag session.
            if (patch.c && patch.c === _draggingEl) break;
            disposalPromises.push(disposeNodes(patch.c));
            break;

          case "REMOVEALL":
            logt("REMOVEALL");
            const childrenToDispose = Array.from(patch.p.childNodes);
            disposalPromises.push(
              Promise.all(childrenToDispose.map((c) => disposeNodes(c))),
            );

            if (patch.p.replaceChildren) {
              patch.p.replaceChildren();
            } else {
              while (patch.p.firstChild) {
                patch.p.removeChild(patch.p.firstChild);
              }
            }
            logte("REMOVEALL");
            break;

          case "REMOVEALL-FAST":
            // const childrenToDispose = Array.from(patch.p.childNodes);
            const oldParent = patch.p;

            // Create fresh parent element with same properties
            const newParent = oldParent.cloneNode(false); // false = no children

            // copy other things
            newParent._events = { ...oldParent._events };

            // Swap immediately (instant, single DOM operation)
            oldParent.parentNode.replaceChild(newParent, oldParent);

            // Update patch.p reference for any subsequent operations
            patch.p = newParent;
            patch?.ref?.(newParent);

            // Async disposal of old parent and all its children
            disposalPromises.push(
              Promise.resolve().then(() => disposeNodes(oldParent)),
            );

            break;

          case "REPLACE":
            patch.p.replaceChild(createElement(patch.c[0]), patch.c[1]);
            disposalPromises.push(disposeNodes(patch.c[1]));
            break;
          case "MOVE": {
            // keyed move
            if (patch.key) {
              const nodeToMove = patch.p.querySelector(
                `:scope > [key="${patch.key}"]`,
              );
              const refNode =
                patch.refNode ??
                (patch.refKey
                  ? patch.p.querySelector(`:scope > [key="${patch.refKey}"]`)
                  : null);
              patch.p.insertBefore(nodeToMove, refNode);
            } else {
              log("op: MOVE, issue: UNHANDLED");
            }
            break;
          }
          case "CONTENT":
            patch.p.textContent = patch.c;
            break;
          case "PATCH": {
            const target =
              patch.c?.nodeType === 1 || patch.c?.nodeType === 3
                ? patch.c
                : patch.p.querySelector(`:scope > [key="${patch.key}"]`);

            if (target) {
              patchNode(target, patch.prev, patch.next);
            }
            break;
          }
        }

        patch.p = patch.c = null;
      }

      _patches.length = 0;

      // Cleanup all references after all disposals complete
      if (disposalPromises.length > 0) {
        Promise.all(disposalPromises)
          .catch((err) => log("Error during node disposal:", err))
          .finally(() => {
            disposalPromises.length = 0;
          });
      }
    }

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
            if (evt === "unmount") {
              current._events[evt]?.();
            }
            current.removeEventListener(evt, current._events[evt], false);
            current._events[evt] = null;
          }
          current._events = null;
        }

        if (current?.__onUnmount) {
          current.__onUnmount?.();
          current.__onUnmount = null;
        }

        cleanupElementEffects(current);

        // Clean up all bubbling event handlers
        for (const key in current) {
          if (key.startsWith("__on")) {
            current[key] = null;
          }
        }

        // Add children to stack
        if (current.childNodes) {
          const _childNodes = current.childNodes;
          for (let i = _childNodes.length - 1; i >= 0; i--) {
            nodeStack.push(_childNodes[i]);
          }
        }

        // Clear references

        current?.remove?.();
        current = null;

        if (nodeStack.length % 50 === 0) {
          await yieldToMain(); // yield between nodes, not mid-childNodes loop
        }
      }

      // Clear final references

      node?.remove?.();
      node = null;
      nodeStack.length = 0;

      // end
    };

    function isWebComponent(element) {
      // Check if the tag name includes a hyphen
      return element.tagName.includes("-");
    }

    ///////////////
    // alternate 1 (non recursive) for walkDom // tested and works
    // inspired by: https://www.youtube.com/watch?v=3nwupG2Joaw
    function domListIterator(_rootNode) {
      // pass rootNode if its not global
      // log(next);
      let arr = [_rootNode];
      let next = _rootNode;

      function iterChild() {
        while (next) {
          // log(next);
          // arr.push(next);
          // const notToSkip = !next.getAttribute("ignorenode");
          const notToSkip = !(
            next?.getAttribute("ignorenode") != null ||
            next.tagName === "IFRAME" ||
            isWebComponent(next)
          );

          if (next.firstElementChild && notToSkip) {
            next = next.firstElementChild;
            // log(next);
            arr.push(next);
          } else {
            iterSibling();
          }
        }
      }

      function iterSibling() {
        while (next) {
          if (next.nextElementSibling) {
            next = next.nextElementSibling;

            // log(next);
            arr.push(next);
            return;
          }

          next = next.parentElement;

          if (next === _rootNode) {
            next = null;
          }
        }
      }

      iterChild();
      next = _rootNode = null;
      return arr;
    }

    function yieldToMain() {
      if (globalThis.scheduler?.yield) {
        return globalThis.scheduler.yield();
      }

      // Fall back to yielding with setTimeout.
      return new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    return {
      forceUpdate,
      addPatches,
      addPropsPatches,
      createElement,
    };
  };

  // Set up the shared scheduler callback
  const _domInstance = _dom();

  // MessageChannel-based scheduler — shared by dom and signals
  class Scheduler {
    constructor() {
      this.dirty = false;
      this.channel = new MessageChannel();
      this.channel.port1.onmessage = () => this.flush();
    }

    schedule() {
      if (this.dirty) return; // already scheduled, batch all calls until flush runs
      this.dirty = true;
      this.channel.port2.postMessage(null); // macrotask — yields to browser
    }

    flush() {
      this.dirty = false;
      this.callback?.();
    }

    setCallback(cb) {
      this.callback = cb;
    }
  }

  // Global scheduler instance
  const updateScheduler = new Scheduler();

  updateScheduler.setCallback(() => {
    _domInstance.forceUpdate();
  });

  dom = {
    ..._domInstance,
    updateScheduler,
  };
}

// export const mount = dom.mount || noop;
export const forceUpdate = dom.forceUpdate || noop;
// export const hydrate = dom.hydrate || noop;
export const createElement = dom.createElement || noop;

export const addPatches = dom.addPatches || noop;
export const addPropsPatches = dom.addPropsPatches || noop;
export const updateScheduler = dom.updateScheduler;

export { signal, effect, batch, computed } from "@simple-signal";
