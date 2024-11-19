// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

console.log("check https://github.com/pomber/incremental-rendering-demo");

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

// end meta

import { atom } from "../simple-state";
// publish as lib: https://www.youtube.com/watch?v=FITxnIDsMnw
// import { diff, patch } from "./vdom-yt";

const microframe = (() => {
  let callStack = [];
  let counter = 0;

  let stack = [];

  let rootNode = null;
  let curr = null;
  let old = null;

  let parent;
  let stk = [],
    CTR = 0;
  let genObj, genNode;

  // let set = new Set();
  // let __k = undefined;
  let oldCallStack = []; // copy of callStack to see cached results
  const ArrIterator = (_from) => {
    let from = _from || 0;

    return {
      get: () => {
        // console.log(from);
        const rv = { curr: oldCallStack[from], idx: from };
        from++;
        return rv;
      },
      reset: (_from) => {
        from = _from || 0;
      },
    };
  };
  let iter;

  // lazy array iterator

  function* stepGen(steps) {
    while (true) yield* steps;
  }

  // mount n unmount

  let currMount = null,
    currUnmount = null;

  function onMount(cb) {
    // console.log(counter, cb);
    currMount = cb;
  }

  function onCleanup(cb) {
    // console.log(callStack[counter]);
    currUnmount = cb;
  }

  function callUnmountAll() {
    let len = oldCallStack.length;
    let clen = callStack.length;

    for (let i = 0; i < len; ++i) {
      let found = false;
      for (let j = 0; j < clen; ++j) {
        if (
          oldCallStack[i].fname === callStack[j].fname &&
          oldCallStack[i].p === callStack[j].p
        ) {
          found = true;
          break;
        } else {
        }
      }

      if (!found) {
        // console.log("call unmount for ", oldCallStack[i].fname);
        oldCallStack[i]?.unMount?.();
        oldCallStack[i].unMount = null;
      }
    }
  }

  function callMountAll() {
    let len = callStack.length;
    for (let i = 0; i < len; ++i) {
      // console.log(callStack[i]);
      callStack[i]?.mount?.();
      // need to check carefully
      callStack[i].mount = null;
    }
  }

  // vdom

  function h(type, props, ...children) {
    let _fn = null;
    let curParent;

    if (Array.isArray(children)) children = children.flat();

    if (typeof type === "function") {
      curParent = stack[stack.length - 1]?.n;
      // console.log("curr parent is", curParent, type.name);
      stack.push({ n: type?.name });
      if (oldCallStack.length) {
        const exisng = iter.get();
        // console.log(type.name, exisng?.curr?.fname);
        // console.log(
        //   type.name,
        //   exisng?.curr?.fname,
        //   type.name == exisng?.curr?.fname ?? "matched"
        // );

        if (
          type.name == exisng?.curr?.fname &&
          curParent == exisng?.curr?.p &&
          props?.key === exisng?.curr?.key
        ) {
          // console.log("matched for ", exisng);
          // iter.reset(exisng.idx);
          _fn = exisng.curr.fn;
          currMount = exisng.curr.mount;
          currUnmount = exisng.curr.unMount;
        } else {
          let j = exisng.idx + 1;
          let found = false;
          iter.reset(j);
          for (; j < oldCallStack.length; ++j) {
            const exisng2 = iter.get();
            // if (exisng2?.curr == null) break;
            // console.log(
            //   type.name,
            //   exisng2?.curr?.fname,
            //   type.name == exisng2?.curr?.fname ?? "matched"
            // );
            if (
              type.name == exisng2?.curr?.fname &&
              curParent == exisng2?.curr?.p
            ) {
              iter.reset(exisng2.idx); //next search should start from here
              found = true;

              _fn = exisng2.curr.fn;
              currMount = exisng2.curr.mount;
              currUnmount = exisng2.curr.unMount;
              break;
            }
          }
          if (!found) {
            // reset to whatever last found idx
            iter.reset(exisng.idx);
            _fn = type(props, ...children);
          }

          // cache this func

          // callStack[counter] = {
          //   fname: type.name,
          //   fn: _fn,
          //   mount: currMount,
          //   unMount: currUnmount,
          //   // p: curParent,
          // };
        }
      } else {
        // const key = set.has(type.name) ? "k" + counter : undefined;
        // props = { ...props, __k: key };

        _fn = type(props, ...children);
        // callStack[counter] = {
        //   fname: type.name,
        //   key: key,
        //   fn: _fn,
        //   mount: currMount,
        //   unMount: currUnmount,
        // };

        // stack.push(type.name);
        // set.add(type.name);
      }

      callStack[counter] = {
        fname: type.name,
        fn: _fn,
        mount: currMount,
        unMount: currUnmount,
        p: curParent,
      };

      if (props?.key !== undefined) callStack[counter].key = props.key;

      currMount = currUnmount = null;

      counter++;

      // callStack[callStack.length - 1].p = stack[stack.length - 2]?.n;

      // b4
      // console.log(stack, callStack[callStack.length - 1]);

      const rv =
        typeof _fn === "function" ? _fn({ ...props, children: children }) : _fn;

      stack.pop();

      // if (stack[stack.length - 1]?.ch) stack[stack.length - 1].ch.push(popped);
      // else {
      //   // console.log(JSON.stringify(stack));
      //   // console.log(parChild);
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
            $p: curParent,
          };
        }
      }
    }

    // console.log(children);

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
        children,
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
    return isEventProp(name) || name === "forceUpdate";
  }

  function setProp($target, name, value) {
    // console.log(name, value);
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
    } else if (typeof value === "boolean") {
      setBooleanProp($target, name, value);
    } else {
      if (name === "value" || name === "htmlFor")
        // special case
        $target[name] = value;
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
    } else if (!oldVal || newVal !== oldVal) {
      setProp($target, name, newVal);
    }
  }

  function updateProps($target, newProps, oldProps = {}) {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach((name) => {
      updateProp($target, name, newProps[name], oldProps[name]);
    });
  }

  function addEventListeners($target, props) {
    Object.keys(props).forEach((name) => {
      if (isEventProp(name)) {
        $target.addEventListener(extractEventName(name), props[name]);
      }
    });
  }

  // vdom to dom

  // SVG
  const createAndAppendSVG = (tag, attrs, ...children) => {
    function setPropsNS($target, props) {
      Object.keys(props).forEach((name) => {
        // setProp($target, name, props[name]);
        $target.setAttributeNS(null, name, props[name]);
      });
    }

    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    // addAttributes(element, attrs);

    setPropsNS(element, attrs);

    for (const child of children) {
      const childElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        child.type
      );

      setPropsNS(childElement, child.props);

      // appendChild(element, childElement);
      element.appendChild(childElement);
    }

    return element;
  };

  // end SVG

  function createElement(node) {
    if (!node?.type) {
      if (node?.$c) {
        // const tnode = document.createTextNode(
        //   node?.value == null || node?.value == undefined ? "" : node?.value
        // );
        // return tnode;
        if (!node.children) {
          const tnode = document.createTextNode(
            node?.value == null || node?.value == undefined ? "" : node?.value
          );
          return tnode;
        } else {
          return createElement(node.children[0]);
        }
      } else
        return document.createTextNode(
          node == null || node == undefined ? "" : node
        );
    }

    //special case Compo with Array return and no type (parent)
    // doc fragement case
    if (node?.type === "df") {
      // console.warn(
      //   "fragment support is experimental and nested fragments NOT supported!!!"
      // );
      const $el2 = document.createDocumentFragment();

      node.children.map(createElement).forEach($el2.appendChild.bind($el2));

      return $el2;
    }

    if (node.type === "svg") {
      return createAndAppendSVG(node.type, node.props, ...node.children);
    }

    const $el = document.createElement(node.type);
    if (node?.$c) {
      $el.dataset["cp"] = node.$c + ":" + node?.$p;
    } else {
      setProps($el, node.props);
      addEventListeners($el, node.props);
    }

    node.children.map(createElement).forEach($el.appendChild.bind($el));

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
        node1?.value !== node2?.value
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
        // console.log(o.$c);

        // console.log(temp);
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
    if (rootNode?.firstChild) {
      console.log(">>> this is route change");
      while (callStack?.length) {
        const fn = callStack.splice(callStack.length - 1, 1)?.[0];
        // console.log(fn);
        fn?.unMount?.();

        counter--;
      }
    }
    curr = initCompo;
    // console.log(curr);
    // console.log(performance.now());
    old = curr(); // create latest vdom
    // console.log(performance.now());
    console.log(callStack, old);
    // updateElement(rootNode, old);
    // 1. set dom
    // rootNode.appendChild(createElement(old));
    if (rootNode.firstChild)
      rootNode.replaceChild(createElement(old), rootNode.firstChild);
    else rootNode.appendChild(createElement(old));

    // console.log(callStack);
    callMountAll();

    iter = ArrIterator();
    oldCallStack = [...callStack];
    callStack = [];
    // oldCallStack = [];
    // oldCallStack.push(callStack[0]);

    // 2. trigger lifecycle
    // callMountAll();
  }

  let patches = [];

  // all delta updates
  function forceUpdate() {
    counter = 0; // v imp

    // callStack = [];
    iter = ArrIterator();

    console.log(performance.now());

    let current = curr(); // create latest vdom
    console.log(old, current);
    // const oldStack = CompoIterator().iterate(old);
    // const currStack = CompoIterator().iterate(current);

    // console.log(CompoIterator().get(old, "TextArea"));

    // console.log(oldCallStack, callStack);

    // console.log(performance.now());

    // new diff from yt

    // const patches = diff(current, old);
    // console.log(patches);
    // patch(rootNode, patches);

    // end new diff from yt

    // 1. call unmount before dom update
    callUnmountAll();
    CTR = 0;
    stk = [];
    // stk = walkDom(rootNode);
    stk = domListIterator(rootNode);
    // genObj = traverseTree(rootNode);
    // genNode = genObj.next();
    // console.log(genObj.next());

    // 2. calculate diff
    patches = [];
    updateElement(rootNode, current, old);

    console.log(performance.now());

    // console.log("===================");

    setTimeout(() => {
      // 3. update dom
      console.log(patches);
      applyPatches(patches);
      // 3. trigger lifecycle
      // callLifeCycleHooks(callStack, oldStack);

      callMountAll();
      // console.log(callStack, oldStack);

      // backup for future comparison
      oldCallStack = [...callStack];
      callStack = [];
      old = current;
    }, 0);
  }

  function isValid(v) {
    return v !== undefined || v !== "";
  }

  // variation impl
  // 1. https://www.youtube.com/watch?v=l2Tu0NqH0qU and https://github.com/Matt-Esch/virtual-dom
  // 2. https://www.youtube.com/watch?v=85gJMUEcnkc

  let last = null;
  let optiPossible = false;
  let gdf = null;

  function updateElement($parent, newNode, oldNode, index = 0) {
    if (!isValid(oldNode)) {
      // if (oldNode?.type) {
      console.log("append: ");
      // $parent.appendChild(createElement(newNode));
      patches.push({ p: $parent, op: "APPEND", c: createElement(newNode) });
    } else if (!isValid(newNode)) {
      // $parent.removeChild($parent.childNodes[index]);

      patches.push({ p: $parent, op: "REMOVE", c: $parent.childNodes[index] });
    } else if (changed(newNode, oldNode)) {
      if ($parent?.childNodes[index]) {
        // $parent?.replaceChild(
        //   createElement(newNode),
        //   $parent.childNodes[index]
        // );

        patches.push({
          p: $parent,
          op: "REPLACE",
          c: [createElement(newNode), $parent.childNodes[index]],
        });

        // additoinal logic for frag modify. This changed on 2-sep
        const fragChildLen = oldNode?.props?.fragChildLen;
        // for frag case remove additional as well
        if (oldNode?.type === "df" && fragChildLen) {
          // for (let i = 1; i < fragChildLen; ++i) {
          for (let i = fragChildLen - 1; i >= 1; --i) {
            // console.log("remove: ", $parent.childNodes[index + i]);
            // $parent?.removeChild($parent.childNodes[index + i]);
            patches.push({
              p: $parent,
              op: "REMOVE",
              c: $parent.childNodes[index + i],
            });
          }
        }
      } else {
        //special case Compo with Array manipulation or no type (parent) for updating
        if ($parent?.appendChild) {
          // console.log("changed append: ");
          const newEl = createElement(newNode);
          if (newEl?.nodeName) {
            // its dom node
            // console.log("use df");
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
      if (newNode?.type !== "df") {
        // genNode = genObj.next();
        CTR += 1;
        if (rootNode.contains(stk[CTR])) {
        } else {
          while (CTR < stk.length) {
            CTR += 1;
            if (rootNode.contains(stk[CTR])) break;
            else {
              stk[CTR] = null;
            }
          }
        }
      }
      const domNode = stk[CTR];
      // const temp = genObj.next();
      // console.log(domNode, genNode?.value);
      // updateProps($parent.childNodes[index], newNode.props, oldNode.props);
      if (last !== domNode) {
        updateProps(domNode, newNode.props, oldNode.props);
        last = domNode;
      }
      // updateProps(domNode, newNode.props, oldNode.props);

      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;

      if (newLength > 100) {
        optiPossible = true;
        gdf = document.createDocumentFragment();
        console.log(
          "have for loop custom component or see how this can be optimized"
        );
      }

      for (let i = 0; i < newLength || i < oldLength; i++) {
        updateElement(
          // $parent.childNodes[index],
          domNode,
          // genNode?.value,

          newNode.children[i],
          oldNode.children[i],
          i
        );
      }

      if (optiPossible) {
        console.log("after for", domNode);
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

    // console.log(patches);
  }

  function applyPatches(patches) {
    // console.log(patches);
    patches.forEach((patch) => {
      switch (patch.op) {
        case "APPEND":
          patch.p.appendChild(patch.c);
          break;
        case "REMOVE":
          patch.p.removeChild(patch.c);
          break;
        case "REPLACE":
          console.log(patch);
          patch.p.replaceChild(patch.c[0], patch.c[1]);
          break;
        case "CONTENT":
          patch.p.textContent = patch.c;
          break;
      }
    });
  }

  // let patchIndex = 0;
  // function applyPatches(patches) {
  //   console.log(patches);
  //   window.requestAnimationFrame(() => {
  //     applyPatchBatch(patches);
  //   });
  // }

  // function applyPatchBatch(patches) {
  //   const batchSize = 50; // Adjust batch size based on performance needs
  //   const batchEnd = Math.min(patchIndex + batchSize, patches.length);

  //   for (let i = patchIndex; i < batchEnd; i++) {
  //     const patch = patches[i];
  //     switch (patch.op) {
  //       case "APPEND":
  //         patch.p.appendChild(patch.c);
  //         break;
  //       case "REMOVE":
  //         patch.p.removeChild(patch.c);
  //         break;
  //       case "REPLACE":
  //         patch.p.replaceChild(patch.c[0], patch.c[1]);
  //         break;
  //       case "CONTENT":
  //         patch.p.textContent = patch.c;
  //         break;
  //     }
  //   }

  //   patchIndex = batchEnd;
  //   if (patchIndex < patches.length) {
  //     window.requestAnimationFrame(() => {
  //       applyPatchBatch(patches);
  //     });
  //   } else {
  //     patchIndex = 0;
  //     patches = [];
  //   }
  // }

  return {
    mount,
    forceUpdate,
    onMount,
    onCleanup,
    h,
  };
})();

export const mount = microframe.mount;
export const forceUpdate = microframe.forceUpdate;
export const onMount = microframe.onMount;
export const onCleanup = microframe.onCleanup;
export const h = microframe.h;

// inspired by https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-3-react-suspense-and-concurrent-mode-5da8c12aed3f
export function Suspense(props, child) {
  // console.log(props);
  let returnVal;
  const [resolved, setResolved] = atom(false);

  // if (props.fetchCompleted) {
  if (resolved()) {
    // this is never exec'ted
    console.log("promise resolved");
    props.children[0](returnVal);
  } else {
    console.log("promise NOT resolved");
    // returnVal = props?.fallback;
    // if fetch prop is provided (it can be any promise)
    if (props?.fetch?.then) {
      props.fetch.then((res) => {
        console.log("promise resolved", res);
        // Suspense({ ...props, fetchCompleted: true }, res);
        returnVal = res;
        setResolved(true);
      });
    } else {
      // else assume its dynamic child compo
      // console.log("NOT very stable, more testing reqd");
      // console.log(props, child);

      child?.value?.then((res) => {
        console.log("promise resolved", res);
        // Suspense({ ...props, fetchCompleted: true }, res);
        returnVal = res();
        setResolved(true);
      });
    }
  }

  return (props) => {
    return resolved()
      ? props?.fetch?.then
        ? props.children[0](returnVal)
        : returnVal // untested, but should work like lazy where it returns default compo
      : props?.fallback;
  };
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
function domListIterator(rootNode) {
  // pass rootNode if its not global
  // console.log(next);
  let arr = [rootNode];
  let next = rootNode;

  function iterChild() {
    while (next) {
      // console.log(next);
      // arr.push(next);
      if (next.firstElementChild) {
        next = next.firstElementChild;
        // console.log(next);
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

        // console.log(next);
        arr.push(next);
        return;
      }

      next = next.parentElement;

      if (next === rootNode) {
        next = null;
      }
    }
  }

  iterChild();
  return arr;
}

///////////////
// possible alternate 2 for walkDom
// actually this doesn't work correctly further investigation reqd

function* traverseTree(node) {
  yield node;

  for (let child of node?.childNodes) {
    if (child.nodeType == 1 && rootNode.contains(child)) {
      yield* traverseTree(child);
    }
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
//   startNode = nextUnitOfWork = document.querySelector("#root-vdom");
//   console.log(performance.now());
//   workLoop();
//   console.log(performance.now());
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
        // console.log("sibling block");
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

function log(message, node) {
  // let node = document.createElement("div");
  // node.textContent = message;
  // document.body.appendChild(node);
  console.log(message, node);
}
