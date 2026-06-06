// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

const IS_PROD = typeof window !== "undefined" ? import.meta.env.PROD : false;

const noop = () => {};
const log = IS_PROD ? noop : console.log;
const logt = IS_PROD ? noop : console.time,
  logte = IS_PROD ? noop : console.timeEnd;

// const log = noop;
// const logt = noop;
// const logte = noop;

log("check https://github.com/pomber/incremental-rendering-demo");

// end meta

// publish as lib: https://www.youtube.com/watch?v=FITxnIDsMnw
// import { diff, patch } from "./vdom-yt";

const NoneType = "NONE",
  TextType = "TEXT";

// all virtual dom
let funcCache = {},
  altFuncCache = {};

function propsChanged(oldProps, newProps) {
  if (oldProps === newProps) return false;
  if (!oldProps || !newProps) return true;

  const oldKeys = Object.keys(oldProps);
  if (oldKeys.length !== Object.keys(newProps).length) return true;

  for (let i = 0; i < oldKeys.length; i++) {
    const key = oldKeys[i];
    if (!(key in newProps) || oldProps[key] !== newProps[key]) {
      return true;
    }
  }
  return false;
}

const microframe = (() => {
  let currComp = null;

  let stack = [];
  let currMount = null,
    currUnmount = null;

  // vdom

  function df(props, ...children) {
    return children;
  }

  function h(type, props, ...children) {
    let curParent;
    let updtFlag = undefined;

    if (Array.isArray(children)) {
      children = children.flat().map((child) => {
        if (typeof child === "string" || typeof child === "number") {
          return { type: TextType, /*props: {},*/ value: String(child) };
        }

        if (child == null || typeof child === "boolean") {
          return { type: NoneType, /*props: {},*/ value: child };
        }
        return child;
      });
    }

    if (typeof type === "function") {
      curParent = stack[stack.length - 1]?.n;
      // log("curre parent is", curParent, type.name);
      const cacheKey = `${type.name}:${curParent}:${props?.key}`;

      // const check = updateComps.has(stack[stack.length - 1]) ? true : false;

      stack.push({ n: type?.name, comp: cacheKey });

      setCurrComp(cacheKey);
      currComp = cacheKey;

      const lastFn = altFuncCache[cacheKey];

      if (lastFn) {
        // this is not beneficial it seems for sans cmopo
        if (
          updateComps.has(stack[stack.length - 2]?.comp) &&
          propsChanged(lastFn.props, props)
        ) {
          updateComps.add(cacheKey);
        }
      } else {
        updateComps.add(cacheKey);
      }

      let rv = type(props, children);

      funcCache[cacheKey] = {
        name: cacheKey,
        // parent: stack[stack.length - 2]?.comp, // this might be useful
        mount: true,
        unMount: null,
        props: props,
      };

      stack.pop();

      setCurrComp(null);
      currComp = stack[stack.length - 1];

      // if (stack[stack.length - 1]?.ch) stack[stack.length - 1].ch.push(popped);
      // else {
      //   // log(JSON.stringify(stack));
      //   // log(parChild);
      //   stack = [];
      // }

      // return { ...rv, $c: type.name, children: rv.children }; //perfect

      // IMP: If we dont want Compo nodes (Switch compo will not work)

      return rv;

      // Below is only required to see compo node, but logic may not work beyond 20th may 2026

      //complex node
      // if (rv?.type) {
      //   return {
      //     ...rv,
      //     // props: rv.props,
      //     $c: cacheKey,
      //     // children: rv.children,
      //     children: [rv],
      //     // dont think its reqd
      //     // fragChildLen: rv?.children.length || undefined,
      //     // $p: curParent,
      //     key: props?.key,
      //     props: props || {},
      //     type: "df",
      //   };
      // }
      // // str, null etc
      // else if (Array.isArray(rv)) {
      //   console.warn(
      //     "Your component named `",
      //     type.name,
      //     "` is returning Array, manipulation to this Array is currently NOT supported and can lead to Unexpected behavior",
      //   );

      //   //special case return value Array and may be no type  (parent)
      //   return {
      //     $c: cacheKey,
      //     type: "df", //assign doc fragment type
      //     children: rv,
      //     // $p: curParent,
      //   };
      // }
      // // return {
      // //   $c: type.name,
      // //   value: rv,
      // //   $p: curParent,
      // // };
      // else {
      //   // there are 2 possiblities
      //   // 1. complex node but with no type

      //   if (rv?.$c) {
      //     // if (!rv.type) {
      //     //   rv.type = "df";
      //     // }
      //     return {
      //       $c: cacheKey,
      //       // value: rv,
      //       // ...rv,
      //       children: [rv],
      //       // type: "df", // sure that type is unavailable hence using df
      //       // $p: curParent,
      //     };
      //   } else {
      //     // or 2. simple node
      //     return {
      //       $c: cacheKey,
      //       // type: "df",
      //       value: rv,
      //       props: props || {},
      //       // $p: curParent,
      //     };
      //   }
      // }
    }

    // log(children);

    if (updateComps.has(stack[stack.length - 1]?.comp))
      // log(currComp);
      updtFlag = true;
    else updtFlag = undefined;

    // frag case
    if (type === "df") {
      let ct = children.length;
      // for (let i = 0; i < children.length; ++i) {
      //   if (children[i]?.type === "df") {
      //     ct += children[i]?.fragChildLen || 0;
      //   } else {
      //     ct += 1;
      //   }
      // }
      return {
        type,
        updtFlag: updtFlag,
        props: props || {},
        fragChildLen: ct,
        children,
      };
    } else
      return {
        // _c,
        type,
        updtFlag: updtFlag,
        props: props || {},
        key: props?.key,
        // children: props?.ignoreNode ? [] : children,
        children:
          type?.includes("-") ||
          props?.ignoreNode ||
          type?.toLowerCase() === "iframe" ||
          type?.toLowerCase() === "script" ||
          type?.toLowerCase() === "template"
            ? []
            : children,
      };
  }

  return {
    h,
    df,
  };
})();

export const h = microframe.h;
export const df = microframe.df;

// end virtual dom

// all dom related functions
let dom = {};

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
      if (isCustomProp(name)) {
        if (isEventProp(name)) {
          const extratedName = extractEventName(name);
          const isNonBubbling = isNonBubblingEvent(extratedName);
          // For bubbling events, store handler reference for global listener
          if (!isNonBubbling) {
            $target[`__${name}`] = value;
          }
        }
        return;
      } else if (name === "className") {
        $target.setAttribute("class", value);
      } else if (name === "style") {
        for (const sk in value) {
          $target.style[sk] = value[sk];
        }
      } else if (name === "ref") {
        value?.($target);
      } else if (name === "ignoreLater") {
        // $target["ignorenode"] = true;
        $target.setAttribute("ignorenode", true);
        $target.removeAttribute(name.toLowerCase());
      } else if (typeof value === "boolean") {
        setBooleanProp($target, name, value);
      } else {
        if (name === "value" || name === "htmlFor") {
          // special case
          $target[name] = value;

          // special handling for select
          const sid = setTimeout(() => {
            clearTimeout(sid);
            $target[name] = value;
          }, 0);
          return;
        }
        $target.setAttribute(name, value);
      }
    }

    function removeProp($target, name, value) {
      if (isCustomProp(name)) {
        return;
      } else if (name === "className") {
        $target.removeAttribute("class");
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

    function addEventListeners($target, props) {
      for (const name in props) {
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
      if (!node?.children) {
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
            // const childLen = node.children.length;

            // const $el2 = $d.createDocumentFragment();
            // for (let i = 0; i < childLen; ++i) {
            //   $el2.appendChild(createElement(node.children[i]));
            // }
            // return $el2;
          }
        } else {
          // return node == null || typeof node === "boolean"
          //   ? $d.createComment(node)
          //   : $d.createTextNode(node);
          if (node?.type === TextType) {
            return $d.createTextNode(node.value);
          }

          if (node?.type === NoneType) {
            return $d.createComment(node.value);
          }
        }
      }

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

      return $el;
    }

    function changed(node1, node2) {
      // if both are compo nodes of type df
      if (node1?.type === node2?.type && node1?.type === "df") {
        return node1?.$c !== node2?.$c;
      } // they are dom nodes
      else
        return (
          // node1 != node2 ||
          typeof node1 !== typeof node2 ||
          // (typeof node1 === "string" && node1 !== node2) ||
          (!node1?.type && node1 !== node2) ||
          node1?.type !== node2?.type ||
          node1?.value !== node2?.value ||
          node1?.props?.name !== node2?.props?.name

          // || (node1?.props && node1.props.forceUpdate)
        );
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

    function mount($root, initCompo) {
      rootNode = $root;
      registerDragListeners();

      curr = initCompo;
      // log(curr);
      // log(performance.now());
      old = curr(); // create latest vdom
      // log(performance.now());
      // log(old);
      // log(funcCache);
      // 1. set dom
      // rootNode.appendChild(createElement(old));
      if (rootNode.firstChild)
        rootNode.replaceChild(createElement(old), rootNode.firstChild);
      else rootNode.appendChild(createElement(old));

      // log(callStack);
      callMountAll();

      altFuncCache = { ...funcCache };
      funcCache = {};
      hydrated = true; // just to be sure
    }

    let patches = [],
      propsPatches = [];

    function removeCommentsWithText(searchText, root = document.body) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_COMMENT,
        null,
        false,
      );

      const commentsToRemove = [];

      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.includes(searchText)) {
          commentsToRemove.push(walker.currentNode);
        }
      }

      // Remove after collecting (to avoid modifying DOM while traversing)
      commentsToRemove.forEach((comment) => comment.remove());

      return commentsToRemove.length;
    }

    function hydrate($root, initCompo) {
      hydrated = false;
      rootNode = $root;
      registerDragListeners();

      curr = initCompo;
      old = curr(); // create latest vdom

      // Usage
      const removedCount = removeCommentsWithText("|", rootNode);
      log(`Removed ${removedCount} comments`);

      callUnmountAll();

      forceUpdate();

      hydrated = true;
    }

    // all delta updates
    function forceUpdate() {
      // counter = 0; // v imp

      // log(performance.now());
      if (!IS_PROD) logt("TETVD");

      let current = curr(); // create latest vdom
      if (!IS_PROD) logte("TETVD");
      log(old, current);
      // const oldStack = CompoIterator().iterate(old);
      // const currStack = CompoIterator().iterate(current);

      // log(CompoIterator().get(old, "TextArea"));

      // log(oldCallStack, callStack);
      // log(funcCache);

      // log(performance.now());

      // 1. call unmount before dom update
      // callUnmountAll();  // moved to setTimeout

      // log(performance.now());

      // 2. calculate diff
      patches = [];
      propsPatches = [];

      if (!IS_PROD) logt("TET");

      // diffElement(rootNode, current, old);
      // wrapper(rootNode, current, old);

      // log(performance.now());

      // log("===================");

      // let tout = setTimeout(() => {
      //   clearTimeout(tout);

      wrapper(rootNode, current, old);

      callUnmountAll();

      // 3. update dom
      // log(patches, propsPatches);
      // console.log(patches);
      if (propsPatches) applyPropsPatches(propsPatches);
      if (patches) applyPatches(patches);
      patches = propsPatches = null;
      // 3. trigger lifecycle
      // callLifeCycleHooks(callStack, oldStack);

      callMountAll();
      // log(callStack, oldStack);

      old = current;

      altFuncCache = { ...funcCache };
      // altFuncCache = structuredClone(funcCache);
      funcCache = {};

      if (!IS_PROD) logte("TET");
      // }, 0);
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

    function wrapper($parent, newNode, oldNode, index = 0) {
      // logt("TED");
      let stk = domListIterator(rootNode);
      // logte("TED");

      let CTR = 0;
      let last = null;
      let optiPossible = false;
      let gdf = null;

      let _C = 0;

      if (navigate.routeChange) {
        // updateComps.clear();
        navigate.set(false);
      }

      const updateCompsSize = updateComps.size;
      let currComp = null;
      let checkAll = updateCompsSize === 0 || !hydrated;

      let actualComparison = !hydrated ? true : false;
      let comparisonsReqd = 0;
      let compareTill = 0;

      function diffChildren(parent, oldChildren, newChildren, idx) {
        //console.log(parent, oldChildren, newChildren)

        // 1. Check if all new children can be mapped using unique keys
        const useKeys =
          oldChildren.every((c) => c.key != null) &&
          newChildren.every((c) => c.key != null);

        if (useKeys) {
          diffWithKeys(parent, oldChildren, newChildren);
        } else {
          diffWithIndices(parent, oldChildren, newChildren, idx);
        }
      }

      function diffWithIndices(parent, oldChildren, newChildren, idx) {
        const minLength = Math.min(oldChildren.length, newChildren.length);

        // Compare overlapping nodes
        for (let i = 0; i < minLength; i++) {
          diffNode(parent, oldChildren[i], newChildren[i], i);
        }

        // Append remaining new nodes
        if (newChildren.length > oldChildren.length) {
          for (let i = minLength; i < newChildren.length; i++) {
            patches.push({ type: "CREATE", p: parent, c: newChildren[i] });
          }
        }
        // Remove excess old nodes
        else if (oldChildren.length > newChildren.length) {
          for (let i = minLength; i < oldChildren.length; i++) {
            patches.push({
              type: "REMOVE",
              p: parent,
              c: parent.childNodes[i],
            });
          }
        }
      }

      function diffWithKeys(parent, oldChildren, newChildren) {
        // Map old keys to their nodes and indices
        const oldKeyMap = new Map(
          oldChildren.map((node, index) => [node.key, { node, index }]),
        );

        // Track the highest index seen in the old list to detect moves
        let lastPlacedIndex = 0;

        newChildren.forEach((newChild, newIndex) => {
          const oldMatch = oldKeyMap.get(newChild.key);

          if (oldMatch) {
            // Node exists, diff its properties/children
            diffNode(parent, oldMatch.node, newChild, newIndex);

            // If its old position is less than lastPlacedIndex, it moved forward
            if (oldMatch.index < lastPlacedIndex) {
              patches.push({
                type: "MOVE",
                p: parent,
                from: oldMatch.index,
                to: newIndex,
                key: newChild.key,
              });
            } else {
              lastPlacedIndex = oldMatch.index;
            }

            // Delete from map to track remaining unpatched old nodes
            oldKeyMap.delete(newChild.key);
          } else {
            // Node is completely new
            patches.push({
              type: "CREATE",
              p: parent,
              node: newChild,
              index: newIndex,
            });
          }
        });

        // Any nodes left in oldKeyMap are no longer in the new list
        oldKeyMap.forEach((oldMatch) => {
          patches.push({ type: "REMOVE", p: parent, key: oldMatch.node.key });
        });
      }

      function diffNode(parent, oldNode, newNode, idx) {
        if (!oldNode) {
          patches.push({ type: "CREATE", p: parent, newNode });
          return;
        }

        if (!newNode) {
          patches.push({ type: "REMOVE", p: parent, oldNode });
          return;
        }

        // Type mismatch requires a full replace
        if (oldNode.type !== newNode.type) {
          patches.push({
            type: "REPLACE",
            p: parent,
            c: [newNode, parent.childNodes[idx]],
          });
          return;
        } else {
          // Update text content
          if (newNode.type === TextType || newNode.type === NoneType) {
            if (oldNode.value !== newNode.value)
              patches.push({
                type: "CONTENT",
                p: parent.childNodes[idx],
                c: newNode.value,
              });
            return;
          }
        }
        let newParent = stk[++CTR];

        // Deeper diffing of props and children goes here
        diffProps(newParent, oldNode.props, newNode.props);
        diffChildren(newParent, oldNode.children, newNode.children);
      }

      /**
       * 4. Helper: Property/Attribute Comparison
       * Finds changes or removals in a node's props object.
       */
      function diffProps(target, oldProps, newProps) {
        const propChanges = {};
        let hasChanges = false;

        // Find updated or added props
        for (const key in newProps) {
          if (newProps[key] !== oldProps[key]) {
            propChanges[key] = newProps[key];
            hasChanges = true;
          }
        }

        // Find removed props
        for (const key in oldProps) {
          if (!(key in newProps)) {
            propChanges[key] = null;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          patches.push({ type: "PROPS", $target: target, props: propChanges });
        }
      }

      diffNode($parent, oldNode, newNode, 0);

      last = gdf = null;
      stk.length = 0;

      updateComps.clear();
      // updateCtx.clear();

      log(_C);
      _C = 0;
    }

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

        switch (patch.type) {
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

          // case "REMOVEALL":
          //   logt("REMOVEALL");
          //   const childrenToDispose = Array.from(patch.p.childNodes);
          //   disposalPromises.push(
          //     Promise.all(childrenToDispose.map((c) => disposeNodes(c))),
          //   );

          //   if (patch.p.replaceChildren) {
          //     patch.p.replaceChildren();
          //   } else {
          //     while (patch.p.firstChild) {
          //       patch.p.removeChild(patch.p.firstChild);
          //     }
          //   }
          //   logte("REMOVEALL");
          //   break;

          case "REMOVEALL":
            // const childrenToDispose = Array.from(patch.p.childNodes);
            const oldParent = patch.p;

            // Create fresh parent element with same properties
            const newParent = oldParent.cloneNode(false); // false = no children

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

          case "CONTENT":
            patch.p.textContent = patch.c;
            break;
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
            current.removeEventListener(evt, current._events[evt], false);
            current._events[evt] = null;
          }
          current._events = null;
        }
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
        return scheduler.yield();
      }

      // Fall back to yielding with setTimeout.
      return new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    return {
      mount,
      forceUpdate,
      hydrate,
      createElement,
    };
  };

  // scheduler

  class Scheduler {
    constructor() {
      this.dirty = false;

      this.channel = new MessageChannel();
      this.channel.port1.onmessage = () => this.flush();
    }

    schedule() {
      if (this.dirty) return; // batches all calls until flush runs
      this.dirty = true;
      this.channel.port2.postMessage(null); // macrotask — yields to browser
    }

    flush() {
      this.dirty = false; // only resets when macrotask fires
      forceUpdate();
    }
  }

  // smartRegisterCallback(forceUpdate);

  const s = new Scheduler();
  smartRegisterCallback(() => {
    s.schedule();
  }, 0);

  dom = {
    ..._dom(),
  };
}

export const mount = dom.mount || noop;
export const forceUpdate = dom.forceUpdate || noop;
export const hydrate = dom.hydrate || noop;
export const createElement = dom.createElement || noop;

// end dom

// other helpful Components
export { Lazy } from "./lazy";
export { memo } from "./memo";
export { Switch, Case, Default } from "./switch";
export { VirtualList } from "./vlist";
export { Loader } from "./loader";

// state import exports

import {
  init,
  reset,
  setCurrComp,
  smartRegisterCallback,
  updateComps,
} from "../simple-state";

// export const createState = _createState;

export {
  createEffect,
  createState,
  createContext,
  createRef,
  skipUpdate,
  batch,
  reset,
  setCurrComp, // only required for loader
} from "../simple-state";
