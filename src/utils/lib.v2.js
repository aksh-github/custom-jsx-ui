import { DiffDOM } from "diff-dom";

/** @jsx dom */

// for mount
let mountArr = [];
let unMountArr = [];

// for rendering
let callStack = [];
let counter = 0;

function reset(hard) {
  counter = 0;

  if (hard) {
    callStack = [];
    // // clear mount
    // mountArr = [];

    // call n clear unmount
    while (unMountArr.length) {
      unMountArr.splice(unMountArr.length - 1, 1)[0]?.();
    }
  }
}

function callMountAll() {
  // do we need maintain this?
  // mountArr.forEach((cb) => {
  //   cb?.();
  // });
  // or remove n call
  mountArr.forEach((cb, idx) => {
    cb?.();
  });

  mountArr = [];
}
// end for rendering

export function mount(cb) {
  mountArr[counter] = cb;
}

export function unMount(cb) {
  unMountArr[counter] = cb;
}

export const dom = (eleType, props, ...children) => {
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    let _fn = null;

    if (callStack[counter]?.fname !== eleType.name) {
      console.log(eleType.name, " not found");

      callStack.splice(counter, 1);

      _fn = eleType(props, ...children);
      callStack.push({ fname: eleType.name, fn: _fn });

      // console.log(unMountArr[counter]);
    } else {
      _fn = callStack[counter].fn;
      // console.log(unMountArr[counter]);
    }
    counter++;
    // news.add(eleType.name);
    // return _fn({ ...props, __spl: "spl", children: children }, children);
    return _fn({ ...props, children: children }, children);
  }

  const el = document.createElement(eleType);
  //   el.dataset.id = ctr++;
  Object.keys(props || {}).forEach((k) => {
    if (k === "style") {
      Object.keys(props[k]).forEach((sk) => {
        el.style[sk] = props[k][sk];
      });
    } else {
      // el[k] = props[k]
      if (k?.startsWith("on")) {
        const evtName = k.replace(/on/, "").toLowerCase();
        el.addEventListener(evtName, props[k]);
      } else if (k?.startsWith("data")) {
        el.setAttribute(k, props[k]);
      } else if (k === "ref") {
        props[k]?.(el);
      } else {
        el[k] = props[k];
      }
      // console.log('spl handling for: ', k)
    }
  });

  const addChild = (child) => {
    if (Array.isArray(child)) {
      child.forEach((c) => addChild(c));
    } else if (typeof child === "object" && child != null) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(child));
    }
  };

  (children || []).forEach((c) => addChild(c));

  return el;
};

let Main = null,
  rootNode = null;
let oldc;

export const render = (_node, _Main) => {
  // reset all callstack
  // calls unmount for all as well
  reset(true);

  rootNode = _node;
  Main = _Main;
  // imp step: set the latest state
  // oldc = Main();
  oldc = dom(Main);
  if (rootNode.firstChild) rootNode.replaceChild(oldc, rootNode.firstChild);
  else rootNode.appendChild(oldc);

  // call mount for all
  callMountAll();

  return oldc;
};

export const forceUpdate = () => {
  reset();
  const dd = new DiffDOM();
  const newc = dom(Main);
  const diff = dd.diff(oldc, newc);

  console.log(diff);

  const timer = setTimeout(() => {
    clearTimeout(timer);
    const debugFlag = dd.apply(rootNode.firstChild, diff);

    // call mount for whatever new
    callMountAll();

    if (!debugFlag) console.log("Something was wrong");

    // imp step: set the latest state
    oldc = newc;
  }, 0);
};
