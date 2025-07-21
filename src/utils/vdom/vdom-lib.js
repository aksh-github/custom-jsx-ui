// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

const log = console.log;
// const log = () => {};
const $d = document;

log("check https://github.com/pomber/incremental-rendering-demo");

// meta answer to locate obj in json and also gives path
// on 17 nov 24

// use it as
// const matches = findMatchingObjects(vdomjson, "key", "value");

function findMatchingObjects(json, key, value) {
  const matches = [];

  // Recursive function to traverse the JSON object
  function traverse(obj, path) {
    // Check if the object has the matching key-value pair
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      isEqual(obj[key], value)
    ) {
      matches.push({ object: obj, path: path });
    }

    // Traverse child objects
    Object.keys(obj).forEach((k) => {
      if (typeof obj[k] === "object" && obj[k] !== null) {
        traverse(obj[k], `${path}.${k}`);
      } else if (Array.isArray(obj[k])) {
        obj[k].forEach((item, index) => {
          traverse(item, `${path}.${k}[${index}]`);
        });
      }
    });
  }

  // Helper function for deep equality check
  function isEqual(a, b) {
    // Handle primitive types
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }

    // Handle objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  // Start traversing from the root object
  traverse(json, "$");

  return matches;
}

function propsChanged(oldProps, newProps) {
  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  if (oldKeys.length !== newKeys.length) return true;

  return oldKeys.some((key) => oldProps[key] !== newProps[key]);
}

// end meta

import {
  // atom,
  createEffect,
  createState,
  init,
  reset,
  setCurrComp,
  skipUpdate,
  updateComps,
  updateCtx,
} from "../simple-state";
// publish as lib: https://www.youtube.com/watch?v=FITxnIDsMnw
// import { diff, patch } from "./vdom-yt";

const microframe = (() => {
  let mountFns = [];
  let funcCache = {},
    altFuncCache = {};
  let counter = 0;
  let currComp = null;

  let stack = [];

  let rootNode = null;
  let curr = null;
  let old = null;

  const eventListeners = new WeakMap();

  function EventListner() {
    return {
      // registerEventListener: (node, type, listener, options) => {
      //   if (!eventListeners.has(node)) eventListeners.set(node, []);

      //   entry.push({ type, listener, options });
      // },

      // getEventListeners: (node) => entry || [],
      unregisterEventListener: (node) => {
        if (eventListeners.has(node)) {
          const entry = eventListeners.get(node);
          if (entry) {
            entry.forEach((evt) => {
              node.removeEventListener(
                evt.replace("__", ""),
                node[evt],
                evt.options
              );
            });
            eventListeners.delete(node);
          }
        }
      },
      unRegisterAllEventListeners: async (node) => {
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
          eventListenerInst.unregisterEventListener(current);

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
          current.nodeValue = null;

          current = null;
        }

        // Clear final references

        node = null;
        nodeStack.length = 0;

        // end
      },
    };
  }

  const eventListenerInst = new EventListner();

  function* stepGen(steps) {
    while (true) yield* steps;
  }

  // mount n unmount

  let currMount = null,
    currUnmount = null;

  function onMount(cb) {
    throw new Error("onMount is deprecated, use createEffect instead");

    // log(counter, cb);
    if (altFuncCache[currComp]?.mount) return;
    // currMount = cb;
    mountFns.push(cb);
    // if (!funcCache[currComp]) mountFns.push(cb);
    // currMount = null;
  }

  function onCleanup(cb) {
    // log(callStack[counter]);
    currUnmount = cb;
  }

  function callUnmountAll() {
    // log(suspenseCache);

    const keys = [];

    Object.keys(altFuncCache).forEach((key) => {
      if (!funcCache[key]) {
        altFuncCache[key].unMount?.();
        altFuncCache[key].unMount = null;
        if (suspenseCache[key]) {
          suspenseCache[key] = null;
          delete suspenseCache[key];
        }

        altFuncCache[key] = null;
        delete altFuncCache[key];

        // reset(key);
        keys.push(key);
      }
    });
    reset(keys);
  }

  function callMountAll() {
    while (mountFns?.length) {
      // log(mountFns.pop());
      mountFns.pop()();
    }

    // if (len)
    init();
  }

  // vdom

  function df(props, ...children) {
    return children;
  }

  function h(type, props, ...children) {
    let _fn = null;
    let curParent;

    if (Array.isArray(children)) children = children.flat();

    if (typeof type === "function") {
      curParent = stack[stack.length - 1]?.n;
      // log("curr parent is", curParent, type.name);
      stack.push({ n: type?.name });

      const cacheKey = `${type.name}:${curParent}:${props?.key}`;

      setCurrComp(cacheKey);
      currComp = cacheKey;

      let rv = type(props, ...children);

      if (altFuncCache) {
        const exisng = altFuncCache[cacheKey];
        // altFuncCache[cacheKey] = null;
        if (exisng) {
          // rv = exisng.fn;
          currMount = true;
          // exisng.mount = null;
          currUnmount = exisng.unMount;
        } else {
          // to maintain order
          // rv = type(props, ...children);
          // _fn = type;
          if (currMount) mountFns.push(currMount);
        }
      }

      funcCache[cacheKey] = {
        fname: type.name,
        // fn: _fn,
        mount: true,
        unMount: currUnmount,
        p: curParent,
        key: props?.key,
      };

      // if (props?.key !== undefined) callStack[counter].key = props.key;

      currMount = currUnmount = null;

      counter++;

      // callStack[callStack.length - 1].p = stack[stack.length - 2]?.n;

      // b4
      // log(stack, callStack[callStack.length - 1]);

      // const rv =
      //   typeof _fn === "function" ? _fn({ ...props, children: children }) : _fn;

      setCurrComp(null);

      stack.pop();

      // if (stack[stack.length - 1]?.ch) stack[stack.length - 1].ch.push(popped);
      // else {
      //   // log(JSON.stringify(stack));
      //   // log(parChild);
      //   stack = [];
      // }

      // return { ...rv, $c: type.name, children: rv.children }; //perfect

      //complex node
      if (rv?.type) {
        // rv is frag
        if (rv.type === "df") {
          // rv.props = { ...rv.props, _cc: rv?.children.length };
          props = { ...props, fragChildLen: rv?.children.length };
        }

        return {
          ...rv,
          // props: rv.props,
          $c: type.name,
          // children: rv.children,
          children: [rv],
          $p: curParent,
          key: props?.key,
          props: props || {},
          type: "df",
        };
      }
      // str, null etc
      else if (Array.isArray(rv)) {
        console.warn(
          "Your component named `",
          type.name,
          "` is returning Array, manipulation to this Array is currently NOT supported and can lead to Unexpected behavior"
        );

        //special case return value Array and may be no type  (parent)
        return {
          $c: type.name,
          type: "df", //assign doc fragment type
          children: rv,
          $p: curParent,
        };
      }
      // return {
      //   $c: type.name,
      //   value: rv,
      //   $p: curParent,
      // };
      else {
        // there are 2 possiblities
        // 1. complex node but with no type

        if (rv?.$c) {
          // if (!rv.type) {
          //   rv.type = "df";
          // }
          return {
            $c: type.name,
            // value: rv,
            // ...rv,
            children: [rv],
            // type: "df", // sure that type is unavailable hence using df
            $p: curParent,
          };
        } else {
          // or 2. simple node
          return {
            $c: type.name,
            value: rv,
            props: props || {},
            $p: curParent,
          };
        }
      }
    }

    // log(children);

    // frag case
    if (type === "df") {
      let ct = 0;
      for (let i = 0; i < children.length; ++i) {
        if (children[i]?.type === "df") {
          ct += children[i]?.props?.fragChildLen || 0;
        } else {
          ct += 1;
        }
      }
      return {
        type,
        props: { ...props, fragChildLen: ct },
        children,
      };
    } else
      return {
        // _c,
        type,
        props: props || {},
        // children: props?.ignoreNode ? [] : children,
        children:
          type?.includes("-") ||
          props?.ignoreNode ||
          type?.toLowerCase() === "iframe" ||
          type?.toLowerCase() === "template"
            ? []
            : children,
      };
  }

  // dom helpers

  function setBooleanProp($target, name, value) {
    if (value) {
      $target.setAttribute(name, value);
      $target[name] = true;
    } else {
      $target[name] = false;
    }
  }

  function removeBooleanProp($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
  }

  function isEventProp(name) {
    return /^on/.test(name);
  }

  function extractEventName(name) {
    return name.slice(2).toLowerCase();
  }

  function isCustomProp(name) {
    return (
      isEventProp(name) ||
      name === "fragChildLen" ||
      // name === "ignoreNode" ||
      name === "fallback"
    );
  }

  function setProp($target, name, value) {
    // log(name, value);
    if (isCustomProp(name)) {
      return;
    } else if (name === "className") {
      $target.setAttribute("class", value);
    } else if (name === "style") {
      Object.keys(value).forEach((sk) => {
        $target.style[sk] = value[sk];
      });
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
        setTimeout(() => {
          $target[name] = value;
        }, 0);
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
    Object.keys(props).forEach((name) => {
      setProp($target, name, props[name]);
    });
  }

  function updateProp($target, name, newVal, oldVal) {
    if (!newVal && (newVal === undefined || newVal === null)) {
      removeProp($target, name, oldVal);
    } else if (isCustomProp(name)) {
      // if (isEventProp(name)) {
      //   if (name === "onSubmit") addEventListeners($target, { [name]: newVal });
      // }
    } else if (!oldVal || newVal !== oldVal) {
      setProp($target, name, newVal);
    }
  }

  function updateProps($target, newProps, oldProps = {}) {
    // if (newProps.ignoreNode || newProps.ignoreLater) {
    //   console.log($target, newProps);
    // }
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach((name) => {
      if (name === "onSubmit")
        addEventListeners($target, { [name]: newProps[name] });
      else updateProp($target, name, newProps[name], oldProps[name]);
    });
  }

  function addEventListeners($target, props) {
    Object.keys(props).forEach((name) => {
      if (isEventProp(name)) {
        const extratedName = extractEventName(name);

        if (!eventListeners.has($target))
          eventListeners.set($target, new Set());

        // for json based rendering, form and onblur this is reqd
        // if (extratedName in $target || $target.tagName === "FORM")

        // eventListenerInst.registerEventListener(
        //   $target,
        //   extratedName,
        //   props[name]
        // );
        const evtName = `__${extratedName}`;
        const entry = eventListeners.get($target);

        if ($target[evtName]) {
          $target.removeEventListener(extratedName, $target[evtName], true);
          // setTimeout(() => {
          //   const idx = entry.findIndex((_evt) => _evt == evtName);
          //   if (idx !== -1) entry.splice(idx, 1);
          // }, 0);
        }
        $target[evtName] = props[name];
        $target.addEventListener(extratedName, props[name], true);
        entry.add(evtName);
        // console.log(eventListeners);
      }
    });
  }

  // vdom to dom

  // SVG

  const $sns = "http://www.w3.org/2000/svg";

  const createAndAppendSVG = (tag, attrs, ...children) => {
    function setPropsNS($target, props) {
      Object.keys(props).forEach((name) => {
        // setProp($target, name, props[name]);
        $target.setAttributeNS(null, name, props[name]);
      });
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
      while (i < len && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
        parent.appendChild(createElement(children[i]));
        i++;
      }
      if (i < len) {
        requestIdleCallback(processChunk);
      }
    }
    requestIdleCallback(processChunk);
  };

  function createElement(node) {
    if (!node?.type) {
      if (node?.$c) {
        // const tnode = $d.createTextNode(
        //   node?.value == null || node?.value == undefined ? "" : node?.value
        // );
        // return tnode;
        if (!node.children) {
          const tnode = $d.createTextNode(
            node?.value == null || node?.value == undefined ? "" : node?.value
          );
          return tnode;
        } else {
          return createElement(node.children[0]);
        }
      } else
        return $d.createTextNode(node == null || node == undefined ? "" : node);
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

  function CompoIterator() {
    let temp = [];
    let s = null;

    function iterate(o) {
      if (o?.$c) {
        temp.push(o.$c);
        if (o?.children) {
          o.children.forEach((_o) => {
            iterate(_o);
          });
        }
        // log(o.$c);

        // log(temp);
        return [...temp];
      } else if (o?.children) {
        o.children.forEach((_o) => {
          iterate(_o);
        });
      }
    }

    function get(o, name, par) {
      if (o?.$c) {
        // temp.push(o.$c);
        if (o.$c === name && o.$p === par) {
          s = o;
        }
        if (o?.children && !s) {
          o.children.forEach((_o) => {
            get(_o, name, par);
          });
        }
        return s;
      } else if (o?.children) {
        o.children.forEach((_o) => {
          get(_o, name, par);
        });
      }
    }

    return {
      iterate: iterate,
      get,
    };
  }

  // moved top
  // let rootNode = null;
  // let curr = null;
  // let old = null;

  // only 1st type (complete rewrite etc)

  function mount($root, initCompo) {
    rootNode = $root;
    // 0. for route change clean existing things
    // if (rootNode?.firstChild) {
    //   log(">>> this is route change");
    //   while (callStack?.length) {
    //     const fn = callStack.splice(callStack.length - 1, 1)?.[0];
    //     // log(fn);
    //     fn?.unMount?.();

    //     counter--;
    //   }
    // }
    curr = initCompo;
    // log(curr);
    // log(performance.now());
    old = curr(); // create latest vdom
    // log(performance.now());
    log(old);
    log(funcCache);
    // 1. set dom
    // rootNode.appendChild(createElement(old));
    if (rootNode.firstChild)
      rootNode.replaceChild(createElement(old), rootNode.firstChild);
    else rootNode.appendChild(createElement(old));

    // log(callStack);
    callMountAll();

    altFuncCache = { ...funcCache };
    funcCache = {};
  }

  let patches = [],
    propsPatches = [];

  // all delta updates
  function forceUpdate() {
    counter = 0; // v imp

    // log(performance.now());

    let current = curr(); // create latest vdom
    log(old, current);
    // const oldStack = CompoIterator().iterate(old);
    // const currStack = CompoIterator().iterate(current);

    // log(CompoIterator().get(old, "TextArea"));

    // log(oldCallStack, callStack);
    // log(funcCache);

    log(performance.now());

    // 1. call unmount before dom update
    // callUnmountAll();  // moved to setTimeout

    // log(performance.now());

    // 2. calculate diff
    patches = [];
    propsPatches = [];

    // updateElement(rootNode, current, old);
    wrapper(rootNode, current, old);

    log(performance.now());

    // log("===================");

    let tout = setTimeout(() => {
      clearTimeout(tout);

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
    }, 0);
    // requestAnimationFrame(() => {
    //   // 3. update dom
    //   log(patches);
    //   applyPatches(patches);
    //   patches = [];
    //   // 3. trigger lifecycle
    //   // callLifeCycleHooks(callStack, oldStack);

    //   callMountAll();
    //   // log(callStack, oldStack);

    //   // backup for future comparison
    //   oldCallStack = [...callStack];
    //   callStack = [];
    //   old = current;
    // });
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

  window.addEventListener("popstate", () => navigate.set(true));
  window.addEventListener("navigate", () => navigate.set(true));

  function wrapper($parent, newNode, oldNode, index = 0) {
    let stk = domListIterator(rootNode);

    let CTR = 0;
    let last = null;
    let optiPossible = false;
    let gdf = null;

    let _C = 0;

    // if (navigate.routeChange) {
    //   updateComps.clear();
    //   navigate.set(false);
    // }

    const updateCompsSize = updateComps.size;
    let currComp = null;
    let actualComparison = false;
    let comparisonsReqd = 0;
    let compareTill = 0;

    function updateElement($parent, newNode, oldNode, index = 0) {
      // if (!actualComparison && newNode?.type && oldNode?.type)
      //   return doMain(newNode, oldNode);
      if (!actualComparison && updateCompsSize) {
        if (newNode?.type && oldNode?.type) return doMain(newNode, oldNode);
        // if (newNode?.type === oldNode?.type) return;
        if (newNode === oldNode) return;
      }
      _C++;

      // log("compare: ", newNode);

      if (!isValid(oldNode)) {
        // if (oldNode?.type) {
        log("append: ");
        // $parent.appendChild(createElement(newNode));
        patches.push({ p: $parent, op: "APPEND", c: createElement(newNode) });
      } else if (!isValid(newNode)) {
        // $parent.removeChild($parent.childNodes[index]);
        let el = $parent.childNodes[index];

        patches.push({
          p: $parent,
          op: "REMOVE",
          c: el,
        });

        if (el?.nodeType === 1) {
          while (CTR < stk.length) {
            CTR++;

            if (stk[CTR] === el) {
              const allChildLen = el.querySelectorAll("*").length;
              // log(CTR, " CTR BEFORE", stk[CTR]);
              // CTR += allChildLen;
              stk.splice(CTR, allChildLen);
              // log(CTR, " CTR AFTER", stk[CTR]);

              break;
            }
            // console.log(CTR, stk[CTR]);
          }
        }
        el = null;
      } else if (changed(newNode, oldNode)) {
        if ($parent?.childNodes[index]) {
          let el = $parent.childNodes[index];

          patches.push({
            p: $parent,
            op: "REPLACE",
            c: [createElement(newNode), el],
          });

          if (el?.nodeType === 1) {
            while (CTR < stk.length) {
              CTR++;

              if (stk[CTR] === el) {
                const allChildLen = el.querySelectorAll("*").length;
                // log(CTR, " CTR BEFORE", stk[CTR]);
                // CTR += allChildLen;
                stk.splice(CTR, allChildLen);
                // log(CTR, " CTR AFTER", stk[CTR]);

                break;
              }
              // console.log(CTR, stk[CTR]);
            }
          }

          // additoinal logic for frag modify. This changed on 2-sep
          const fragChildLen = oldNode?.props?.fragChildLen;
          // for frag case remove additional as well
          if (oldNode?.type === "df" && fragChildLen) {
            // for (let i = 1; i < fragChildLen; ++i) {
            for (let i = fragChildLen - 1; i >= 1; --i) {
              // log("remove: ", $parent.childNodes[index + i]);
              // $parent?.removeChild($parent.childNodes[index + i]);
              patches.push({
                p: $parent,
                op: "REMOVE",
                c: $parent.childNodes[index + i],
              });
              // need to increment CTR as well 13-Dec
              CTR += 1;
            }
          }

          el = null;
        } else {
          //special case Compo with Array manipulation or no type (parent) for updating
          if ($parent?.appendChild) {
            // log("changed append: ");
            const newEl = createElement(newNode);
            if (newEl?.nodeName) {
              // its dom node
              // log("use df");
              if (optiPossible) {
                // gdf.appendChild(newEl);

                patches.push({
                  p: gdf,
                  op: "APPEND",
                  c: newEl,
                });
              } else {
                // $parent.appendChild(newEl);

                patches.push({
                  p: $parent,
                  op: "APPEND",
                  c: newEl,
                });
              }
            }

            // its text
            else {
              // $parent.textContent = newEl?.textContent;

              patches.push({
                p: $parent,
                op: "CONTENT",
                c: newEl?.textContent,
              });
            }
          } else {
            // $parent?.parentNode?.appendChild(createElement(newNode));

            patches.push({
              p: $parent?.parentNode,
              op: "APPEND",
              c: createElement(newNode),
            });
          }
        }
      } else if (newNode?.type) {
        doMain(newNode, oldNode);
      }
    }

    function doMain(newNode, oldNode) {
      if (newNode?.type !== "df") {
        // genNode = genObj.next();

        CTR += 1;
      } else {
        // log(newNode.props, oldNode.props);

        currComp = `${newNode.$c}:${newNode.$p}:${newNode.key}`;
        let c = currComp.split(":")[0];

        if (
          // currComp === updateComp ||
          updateComps.has(currComp) ||
          newNode.$p === c ||
          newNode.key !== oldNode?.key
        ) {
          actualComparison = true;
        } else {
          // actualComparison = true;
          // if (!actualComparison) {
          //   // log("this must be due to context change");
          //   // if (newNode?.props?.context !== oldNode?.props?.context) {
          //   if (updateCtx.has(newNode?.props?.context)) {
          //     // log("context changed");
          //     actualComparison = true;
          //   }
          // }
        }
      }

      if (actualComparison && comparisonsReqd === 0) {
        log(newNode.props);
        // log(CTR, stk, newNode);
        const { fragChildLen } = newNode.props;
        if (fragChildLen) {
          let qc = CTR + 1;

          for (let i = 0; i < fragChildLen; ++i) {
            let addThisMuch = 0;
            log("qc: ", qc);
            const el = stk[qc];
            // log(el);
            addThisMuch = el?.querySelectorAll("*").length || 0;
            comparisonsReqd += addThisMuch;
            qc += 1 + addThisMuch;
          }
          // log(
          //   "comparisonsReqd till: ",
          //   comparisonsReqd,
          //   stk[CTR + fragChildLen + comparisonsReqd]
          // );
          compareTill = CTR + fragChildLen + comparisonsReqd + 1;
        } else {
          comparisonsReqd += stk[CTR + 1]?.querySelectorAll("*").length || 0;
          // log("comparisonsReqd till: ", stk[CTR + comparisonsReqd + 1]);
          compareTill = CTR + comparisonsReqd + 1;
        }
      }

      const domNode = stk[CTR];

      if (CTR === compareTill + 1) {
        actualComparison = false;
        comparisonsReqd = 0;
        compareTill = 0;
      }

      if (last !== domNode) {
        // updateProps(domNode, newNode.props, oldNode.props);

        // const nl = Object.keys(newNode.props).length;
        // const ol = Object.keys(oldNode.props).length;

        // if (nl === ol && nl === 0) {
        // } else if (newNode.props.ignoreNode || newNode.props.ignoreLater) {
        //   return;
        // } else {
        //   if (actualComparison)
        //     propsPatches.push({
        //       $target: domNode,
        //       newProps: newNode.props,
        //       oldProps: oldNode.props,
        //     });
        // }

        if (newNode.props.ignoreNode) return;

        if (actualComparison) {
          if (propsChanged(oldNode.props, newNode.props))
            propsPatches.push({
              $target: domNode,
              newProps: newNode.props,
              oldProps: oldNode.props,
            });
        }

        last = domNode;
      }

      if (newNode?.props?.cacheKey) {
        //&& !newNode.children[0]?.props?.__cached
        // doMain(newNode.children[0], oldNode.children[0]);
        const isCached = newNode.children[0]?.props?.__cached;
        const old = isCached ? oldNode.children[0] : null;

        if (updateCompsSize && !isCached) actualComparison = true;

        updateElement(stk[++CTR], newNode.children[0], old, 0);
        return;
      } else {
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;

        if (newLength > 100) {
          optiPossible = true;
          gdf = $d.createDocumentFragment();
          log(
            "have for loop custom component or see how this can be optimized"
          );
        }

        for (let i = 0; i < newLength || i < oldLength; i++) {
          updateElement(domNode, newNode.children[i], oldNode.children[i], i);
        }
      }

      if (optiPossible) {
        // log("after for", domNode);
        // domNode.appendChild(gdf);

        patches.push({
          p: domNode,
          op: "APPEND",
          c: gdf,
        });

        optiPossible = false;
        gdf = null;
      }
    }

    updateElement($parent, newNode, oldNode, index);

    stk = last = gdf = null;

    updateComps.clear();
    updateCtx.clear();

    log(_C);
    _C = 0;
  }

  function applyPropsPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();

      updateProps(patch.$target, patch.newProps, patch.oldProps);

      patch.$target = null;
      patch.newProps = null;
      patch.oldProps = null;
      // patch = null;
    }
    patches = null;
  }

  function applyPatches(patches) {
    // log(patches);
    while (patches.length) {
      const patch = patches.shift();

      switch (patch.op) {
        case "APPEND":
          patch.p.appendChild(patch.c);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "REMOVE":
          eventListenerInst.unRegisterAllEventListeners(patch.c);

          if (patch.c?.nodeType === 1) {
            requestAnimationFrame(() => {
              // removeAllEventListeners(patch.c);
              patch.c.innerHTML = "";

              patch.p.removeChild(patch.c);

              patch.c = null;
              patch.p = null;
              patch.op = null;
            });
          } else {
            patch.p.removeChild(patch.c);
          }

          break;
        case "REPLACE":
          // log(patch);
          // patch.p.replaceChild(patch.c[0], patch.c[1]);
          patch.p.insertBefore(patch.c[0], patch.c[1]);
          eventListenerInst.unRegisterAllEventListeners(patch.c[1]);

          if (patch.c[1]?.nodeType === 1) {
            // log(patch.c[1]);
            requestAnimationFrame(() => {
              // removeAllEventListeners(patch.c[1]);
              // patch.c[1].innerHTML = "";
              patch.p.removeChild(patch.c[1]);

              // patch.c[1] = null;
              patch.c[0] = patch.c[1] = null;
              patch.p = null;
              patch.op = null;
            });
          } else {
            patch.p.removeChild(patch.c[1]);
          }

          break;
        case "CONTENT":
          patch.p.textContent = patch.c;
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
      } // switch
    }

    patches = null;
  }

  return {
    mount,
    forceUpdate,
    onMount,
    onCleanup,
    h,
    df,
    createElement,
  };
})();

export const mount = microframe.mount;
export const forceUpdate = microframe.forceUpdate;
export const onMount = microframe.onMount;
export const onCleanup = microframe.onCleanup;
export const h = microframe.h;
export const df = microframe.df;
export const createElement = microframe.createElement;

const suspenseCache = {};

// inspired by https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-3-react-suspense-and-concurrent-mode-5da8c12aed3f
// export function Suspense(props, child) {
//   // if already in cache then return
//   const cached = suspenseCache[`${props?.cacheKey}`];
//   if (cached) {
//     if (cached.returnFn) {
//       cached.compo(child?.props);
//       return () => cached.returnFn(child?.props);
//     } else {
//       // return suspenseCache[`${props?.cacheKey}`](child?.props);
//       return cached.callbackFn(cached.returnVal);
//     }
//   }

//   // log(props);
//   let returnVal;
//   const [resolved, setResolved] = atom(false);

//   // log("promise NOT resolved");

//   if (props?.fetch?.then) {
//     // case 1. if fetch prop is provided (it can be any promise)
//     props.fetch.then((res) => {
//       // log("promise resolved", res);
//       // Suspense({ ...props, fetchCompleted: true }, res);
//       returnVal = res;
//       setResolved(true); // need so render is triggered
//     });
//   } else {
//     // case 2. if child is a promise module
//     child?.value
//       ?.then((res) => {
//         returnVal = res;
//         // update suspense cache
//         suspenseCache[`${props?.cacheKey}`] = res;

//         setResolved(true); // need so render is triggered
//       })
//       .catch((e) => {
//         // log(e);
//         setResolved(true); // need so render is triggered
//       });
//   }

//   return (props) => {
//     if (resolved()) {
//       if (props?.fetch?.then) {
//         // case when child is render props

//         suspenseCache[`${props?.cacheKey}`] = {
//           callbackFn: props.children[0],
//           returnVal,
//         };

//         return props.children[0](returnVal);
//       } else {
//         // case when child is normal component
//         if (returnVal) {
//           //cache the resolved compo

//           const returnFn = returnVal(props?.children?.[0]?.props || {});

//           suspenseCache[`${props?.cacheKey}`] = {
//             compo: returnVal, // this is compo
//             returnFn: returnFn,
//           };

//           log(suspenseCache[`${props?.cacheKey}`]);

//           return returnFn(props?.children?.[0]?.props || {});
//           // return h(returnVal({ ...props?.children?.[0]?.props }));
//         } else {
//           if (props?.errorFallback) return props?.errorFallback;
//           else return h("div", {}, [null]);
//         }
//       }
//     } else {
//       if (props?.fallback) {
//         // if (typeof props.fallback === "string") {
//         //   return h("div", {}, [props.fallback]);
//         //   // return {
//         //   //   type: "div",
//         //   //   children: [props.fallback],
//         //   // };
//         // } else {
//         //   return props.fallback;
//         // }
//         return h("div", {}, [props.fallback]);
//       } else return h("div", {}, [null]);
//       // return props?.fallback;
//     }
//   };
// }

export function SuspenseV2(props, child) {
  // log(props);
  // let returnVal;
  const [returnVal, , setSpecialReturnVal] = createState(null);
  const [resolved, , setResolved] = createState(false);

  // log("promise NOT resolved");

  createEffect(() => {
    if (props?.fetch?.then) {
      // case 1. if fetch prop is provided (it can be any promise)
      props.fetch.then((res) => {
        // log("promise resolved", res);
        // Suspense({ ...props, fetchCompleted: true }, res);
        // returnVal = res;
        setSpecialReturnVal(res);
        setResolved(true); // need so render is triggered
      });
    } else {
      // case 2. if child is a promise module
      child?.value
        ?.then((res) => {
          // returnVal = res;
          setSpecialReturnVal(res);
          // update suspense cache
          // suspenseCache[`${props?.cacheKey}`] = res;

          setResolved(true); // need so render is triggered
        })
        .catch((e) => {
          // log(e);
          setResolved(true); // need so render is triggered
        });
    }
  }, []);

  // if already in cache then return
  const ch = child || props.children[0];
  const cached =
    suspenseCache[`${ch?.$c}:${ch?.$p}:${ch?.key}`] ||
    suspenseCache[`${props?.cacheKey}`];
  if (cached) {
    if (cached.compo) {
      // cached.compo(child?.props);
      // return () => cached.returnFn(child?.props);
      return h(cached.compo, { ...child?.props, __cached: true });
    } else {
      // return suspenseCache[`${props?.cacheKey}`](child?.props);
      if (cached.callbackFn) return cached.callbackFn(cached.returnVal);
    }
  }

  if (resolved) {
    if (props?.fetch?.then) {
      // case when child is render props pattern

      suspenseCache[`${props?.cacheKey}`] = {
        callbackFn: child || props.children[0],
        returnVal,
      };

      return (child || props.children[0])(returnVal);
    } else {
      // case when child is normal component
      if (returnVal) {
        //cache the resolved compo

        suspenseCache[`${ch?.$c}:${ch?.$p}:${ch?.key}`] = {
          compo: returnVal, // this is compo
        };

        // return h(returnVal, {
        //   ...props?.children?.[0]?.props,
        // });
        return h(returnVal, { ...child?.props, __cached: true });
      } else {
        if (props?.errorFallback) return props?.errorFallback;
        else return h("div", {}, [null]);
      }
    }
  } else {
    if (props?.fallback) {
      return h("div", {}, [props.fallback]);
    } else return h("div", {}, [null]);
    // return props?.fallback;
  }
}

function isWebComponent(element) {
  // Check if the tag name includes a hyphen
  return element.tagName.includes("-");
}

// taken from: https://gist.github.com/umidjons/6865350

function walkDom(start_element) {
  let arr = []; // we can gather elements here
  let loop = function (element) {
    do {
      // we can do something with element
      if (element.nodeType == 1)
        // do not include text nodes
        arr.push(element);
      if (element.hasChildNodes()) loop(element.firstChild);
    } while ((element = element.nextSibling));
  };
  //loop(start_element);
  arr.push(start_element);
  loop(start_element.firstChild); // do not include siblings of start element
  return arr;
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
        next?.getAttribute("ignorenode") ||
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

///////////////
// possible alternate 2 for walkDom
// actually this doesn't work correctly further investigation reqd

function* lazyDOMIterator(root, skip) {
  let current = root;
  while (current) {
    yield current;
    if (!skip(current) && current.children.length > 0) {
      yield* lazyDOMIterator(current.children[0], skip);
    }
    current = current.nextElementSibling;
  }
}

///////////////
// possible alternate 3 (complex) for walkDom

// https://blog.ag-grid.com/inside-fiber-an-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm
// below code modified for dom iteration by me

let startNode;
let nextUnitOfWork;

// how to use / call
// setTimeout(() => {
//   startNode = nextUnitOfWork = $d.querySelector("#root-vdom");
//   log(performance.now());
//   workLoop();
//   log(performance.now());
// }, 1000);

function workLoop() {
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function performUnitOfWork(workInProgress) {
  let next = beginWork(workInProgress);
  if (next === null) {
    next = completeUnitOfWork(workInProgress);
  }
  return next;
}

function beginWork(workInProgress) {
  // log("work performed for ", workInProgress);
  // return workInProgress.child;
  return workInProgress.firstElementChild;
}

function completeUnitOfWork(workInProgress) {
  while (true) {
    // let returnFiber = workInProgress.return;
    // let siblingFiber = workInProgress.sibling;
    let siblingFiber = workInProgress.nextElementSibling;
    let returnFiber = workInProgress.parentElement;

    nextUnitOfWork = completeWork(workInProgress);

    if (siblingFiber !== null) {
      // If there is a sibling, return it
      // to perform work for this sibling

      // if we started here
      if (workInProgress === startNode) {
        // log("sibling block");
        return null;
      }

      return siblingFiber;
    } else if (returnFiber !== null) {
      // If there's no more work in this returnFiber,
      // continue the loop to complete the returnFiber.
      workInProgress = returnFiber;

      continue;
    } else {
      // We've reached the root.

      return null;
    }
  }
}

function completeWork(workInProgress) {
  // log("work completed for ", workInProgress);
  return null;
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
