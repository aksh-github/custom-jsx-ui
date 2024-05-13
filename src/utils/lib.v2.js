import { DiffDOM } from "diff-dom";

/** @jsx dom */

// for rendering
let callStack = [];
let counter = 0;

function reset(hard) {
  counter = 0;
  if (hard) callStack = [];
}

// end for rendering

// for unmount
let hold = [];

export function unMount(cb) {
  hold[counter] = cb;
}

export const dom = (eleType, props, ...children) => {
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    let _fn = null;

    if (callStack[counter]?.fname !== eleType.name) {
      console.log(eleType.name, " not found");

      callStack.splice(counter, 1);

      // for unmount

      const umFn = hold.splice(counter, 1)?.[0];
      if (umFn) {
        // console.log("call unmount for ", umFn);
        umFn();
      }

      // end for unmount

      _fn = eleType(props, ...children);
      callStack.push({ fname: eleType.name, fn: _fn });
      // console.log(hold[counter]);
    } else {
      _fn = callStack[counter].fn;
      // console.log(hold[counter]);
    }
    counter++;
    // news.add(eleType.name);
    return _fn({ ...props, __spl: "spl", children: children }, children);
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

  return el;
};

let Main = null,
  rootNode = null;
let oldc;

export const render = (_node, _Main) => {
  // reset all callstack
  reset(true);

  rootNode = _node;
  Main = _Main;
  // imp step: set the latest state
  // oldc = Main();
  oldc = dom(Main);
  if (rootNode.firstChild) rootNode.replaceChild(oldc, rootNode.firstChild);
  else rootNode.appendChild(oldc);

  // tracking
  // trackOperation(true);

  // end tracking

  return oldc;
};

export const forceUpdate = () => {
  reset();
  const dd = new DiffDOM();
  const newc = dom(Main);
  const diff = dd.diff(oldc, newc);

  console.log(diff);

  setTimeout(() => {
    const debugFlag = dd.apply(rootNode.firstChild, diff);
    if (!debugFlag) console.log("Something was wrong");

    // tracking
    // trackOperation();
    // end tracking

    // imp step: set the latest state
    oldc = newc;
  }, 0);
};

// const trackOperation = (routeChange) => {
//   // compare sets
//   if (olds.size === news.size) {
//     let oArr = Array.from(olds),
//       nArr = Array.from(news);
//     oArr.forEach((oit, idx) => {
//       // console.log(it);
//       const nit = nArr[idx];
//       // const oit = olds.values().next().value;

//       // console.log(oit, nit);

//       if (oit !== nit) {
//         console.log("diff found", oit, nit);
//         console.log("call unmount for", oit);
//         console.log("call Mount for", nit);
//       }
//     });
//   } else {
//     console.log("diff found", olds, news);
//     // let arr = []
//     Array.from(olds)
//       .reverse()
//       .forEach((oit) => {
//         // if (!news.has(oit) && routeChange)
//         console.log("call unmount for", oit);
//       });

//     news.forEach((nit) => {
//       // if (!olds.has(nit) && routeChange)
//       console.log("call Mount for", nit);
//     });
//   }

//   // clear copy etc
//   olds.clear();

//   news.forEach((nit) => {
//     // console.log(it);
//     olds.add(nit);
//   });

//   news.clear();
// };
