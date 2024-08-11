// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

import { state } from "../simple-state";

// suspend impl:
console.log(
  "https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-3-react-suspense-and-concurrent-mode-5da8c12aed3f"
);

// import { diff, patch } from "./vdom-yt";

let callStack = [];
let counter = 0;

let stack = [];

let rootNode = null;
let curr = null;
let old = null;

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

// mount n unmount

let currMount = null,
  currUnmount = null;

export function onMount(cb) {
  // console.log(counter, cb);
  currMount = cb;
}

export function onCleanup(cb) {
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

export function h(type, props, ...children) {
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

      if (type.name == exisng?.curr?.fname && curParent == exisng?.curr?.p) {
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

    currMount = currUnmount = null;

    counter++;

    // callStack[callStack.length - 1].p = stack[stack.length - 2]?.n;

    // b4
    // console.log(stack, callStack[callStack.length - 1]);

    const rv =
      typeof _fn === "function" ? _fn({ ...props, children: children }) : _fn;

    stack.pop();

    // const popped = stack.pop();
    // if (stack[stack.length - 1]?.ch) stack[stack.length - 1].ch.push(popped);
    // else {
    //   // console.log(JSON.stringify(stack));
    //   // console.log(parChild);
    //   stack = [];
    // }

    // return { ...rv, $c: type.name, children: rv.children }; //perfect

    //complex node
    if (rv?.type) {
      return { ...rv, $c: type.name, children: rv.children, $p: curParent };
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
        return {
          $c: type.name,
          // value: rv,
          children: [rv],
          type: "df", // sure that type is unavailable hence using df
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
    if (name === "value")
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

function createElement(node) {
  // if (node?.$c) {
  //   console.log("call mount for >>>>", node.$c);
  // }

  if (!node?.type) {
    if (node?.$c) {
      const tnode = document.createTextNode(
        node?.value == null || node?.value == undefined ? "" : node?.value
      );
      // console.log("call mount for >>>>", node.$c);
      // callStack[counter]?.mount?.();
      // counter++;
      return tnode;
    } else
      return document.createTextNode(
        node == null || node == undefined ? "" : node
      );
  }

  //special case Compo with Array return and no type (parent)
  // doc fragement case
  if (node?.type === "df") {
    console.warn(
      "fragment support is experimental and nested fragments NOT supported!!!"
    );
    const $el2 = document.createDocumentFragment();

    node.children.map(createElement).forEach($el2.appendChild.bind($el2));

    return $el2;
  }

  const $el = document.createElement(node.type);
  setProps($el, node.props);
  if (node?.$c) $el.dataset["cp"] = node.$c + ":" + node?.$p;
  addEventListeners($el, node.props);
  if (node?.$c) {
    // console.log("call mount for >>>>", node.$c);
    // callStack[counter]?.mount?.();
    // counter++;
  }
  node.children.map(createElement).forEach($el.appendChild.bind($el));

  return $el;
}

function changed(node1, node2) {
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

export function mount($root, initCompo) {
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
  old = curr(); // create latest vdom
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

// all delta updates
export function forceUpdate() {
  counter = 0; // v imp

  // callStack = [];
  iter = ArrIterator();

  let current = curr(); // create latest vdom
  // console.log(old, current);
  // const oldStack = CompoIterator().iterate(old);
  // const currStack = CompoIterator().iterate(current);

  console.log(CompoIterator().get(old, "TextArea"));

  console.log(oldCallStack, callStack);

  // new diff from yt

  // const patches = diff(current, old);
  // console.log(patches);
  // patch(rootNode, patches);

  // end new diff from yt

  // 1. call unmount before dom update
  callUnmountAll();

  // 2. update dom
  updateElement(rootNode, current, old);

  // 3. trigger lifecycle
  // callLifeCycleHooks(callStack, oldStack);

  callMountAll();
  // console.log(callStack, oldStack);

  // backup for future comparison
  oldCallStack = [...callStack];
  callStack = [];
  old = current;
}

function isValid(v) {
  return v !== undefined || v !== "";
}

// variation impl
// 1. https://www.youtube.com/watch?v=l2Tu0NqH0qU and https://github.com/Matt-Esch/virtual-dom
// 2. https://www.youtube.com/watch?v=85gJMUEcnkc

const patches = [];

export function updateElement($parent, newNode, oldNode, index = 0) {
  if (!isValid(oldNode)) {
    // if (oldNode?.type) {
    $parent.appendChild(createElement(newNode));
    // patches.push({ p: $parent, op: "APPEND", c: createElement(newNode) });
  } else if (!isValid(newNode)) {
    $parent.removeChild($parent.childNodes[index]);
    // patches.push({ p: $parent, op: "REMOVE", c: $parent.childNodes[index] });
  } else if (changed(newNode, oldNode)) {
    if ($parent?.childNodes[index])
      $parent?.replaceChild(createElement(newNode), $parent.childNodes[index]);
    // patches.push({
    //   p: $parent,
    //   op: "REPLACE",
    //   c: [createElement(newNode), $parent.childNodes[index]],
    // });
    else {
      //special case Compo with Array manipulation or no type (parent) for updating
      if ($parent?.appendChild) {
        const newEl = createElement(newNode);
        if (newEl?.nodeName)
          // its dom node
          $parent.appendChild(newEl);
        // patches.push({
        //   p: $parent,
        //   op: "APPEND",
        //   c: newEl,
        // });
        // its text
        else $parent.textContent = newEl?.textContent;
        // else
        //   patches.push({
        //     p: $parent,
        //     op: "CONTENT",
        //     c: newEl?.textContent,
        //   });
      } else {
        $parent?.parentNode?.appendChild(createElement(newNode));
        // patches.push({
        //   p: $parent?.parentNode,
        //   op: "APPEND",
        //   c: createElement(newNode),
        // });
      }
    }
  } else if (newNode?.type) {
    updateProps($parent.childNodes[index], newNode.props, oldNode.props);
    const newLength = newNode.children.length;
    const oldLength = oldNode.children.length;

    for (let i = 0; i < newLength || i < oldLength; i++) {
      // const parent =
      //   newNode?.type === "df" ? $parent : $parent.childNodes[index];
      // if (newNode?.type === "df") console.log(newNode, parent);
      updateElement(
        $parent.childNodes[index],
        // parent,

        newNode.children[i],
        oldNode.children[i],
        i
      );
      }
  }

  // console.log(patches);
}

export function Suspense(props) {
  // console.log(props);
  let returnVal;
  const resoSt = state({ resolved: false });

  if (props.fetchCompleted) {
    console.log("promise resolved");
    props.children[0](returnVal);
    } else {
    console.log("promise NOT resolved");
    // returnVal = props?.fallback;
    if (props?.fetch?.then) {
      props.fetch.then((res) => {
        console.log("promise resolved", res);
        // Suspense({ ...props, fetchCompleted: true }, res);
        returnVal = res;
        resoSt.set({ resolved: true });
      });
    }
  }

  return (props) => {
    return resoSt.get("resolved")
      ? props.children[0](returnVal)
      : props?.fallback;
  };
}
