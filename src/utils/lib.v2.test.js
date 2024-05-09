import { DiffDOM } from "diff-dom";

/** @jsx dom */

// let ctr = 0;
let last = null;
let arr = [];

const map = new Map();

const tracker = {
  fc: [],
  rv: [],
};

export const dom = (eleType, props, ...children) => {
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    // if (!map.has(eleType.name)) {
    //   const rfunc = eleType(props, children);
    //   map.set(eleType.name, rfunc);
    // }

    return eleType(props, children);
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
      } else {
        el[k] = props[k];
        if (k === "$") console.log(el);
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

  // if(children)
  // console.log(children.length)

  (children || []).forEach((c) => addChild(c));

  // console.log(children)

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
  oldc = Main();
  rootNode.appendChild(oldc);

  return oldc;
};

export const reRender = () => {
  const dd = new DiffDOM();
  const newc = Main();
  const diff = dd.diff(oldc, newc);
  console.log(diff);

  const debugFlag = dd.apply(rootNode.querySelector("div:nth-child(1)"), diff);

  if (!debugFlag) console.log("Something was wrong");

  // imp step: set the latest state
  oldc = newc;
};
