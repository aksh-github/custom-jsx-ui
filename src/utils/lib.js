import { DiffDOM } from "diff-dom";

/** @jsx dom */

// let ctr = 0;
let last = null;
let arr = [];

export const dom = (eleType, props, ...children) => {
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    // console.log('func', eleType, eleType.parentNode)
    // props = {
    //   ...props,
    //   __spl: "spl",
    // };
    return eleType({ ...props, __spl: "spl", children: children }, children);
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

  last = el;

  return el;
};

let Main = null,
  rootNode = null;
let oldc;

export const render = (_node, _Main) => {
  rootNode = _node;
  Main = _Main;
  // imp step: set the latest state
  // oldc = Main();
  oldc = dom(Main);
  if (rootNode.firstChild) rootNode.replaceChild(oldc, rootNode.firstChild);
  else rootNode.appendChild(oldc);

  return oldc;
};

export const forceUpdate = () => {
  const dd = new DiffDOM();
  const newc = dom(Main);
  const diff = dd.diff(oldc, newc);
  console.log(diff);

  setTimeout(() => {
    const debugFlag = dd.apply(rootNode.firstChild, diff);
    if (!debugFlag) console.log("Something was wrong");

    // imp step: set the latest state
    oldc = newc;
  }, 0);
};
