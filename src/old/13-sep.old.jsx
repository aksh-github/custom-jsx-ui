// https://frontendmasters.com/blog/vanilla-javascript-reactivity/
// https://gist.github.com/1Marc/09e739caa6a82cc176ab4c2abd691814

// https://dev.to/fabiospampinato/voby-simplifications-over-solid-no-babel-no-compiler-5epg
// voby link ^

let context = [];

function untrack(fn) {
  const prevContext = context;
  context = [];
  const res = fn();
  context = prevContext;
  return res;
}

function cleanup(observer) {
  for (const dep of observer.dependencies) {
    dep.delete(observer);
  }
  observer.dependencies.clear();
}

function subscribe(observer, subscriptions) {
  subscriptions.add(observer);
  observer.dependencies.add(subscriptions);
}

const subscriptions = new Set();

function createSignal(value) {
  const read = () => {
    const observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };
  const write = (newValue) => {
    value = newValue;
    for (const observer of [...subscriptions]) {
      observer.execute();
    }
  };

  return [read, write];
}

// my modified createSignal

// function createSignal(_initValue) {
//     let first=true;
//     let value;

//     if(first) {
//         value = _initValue
//         first = false
//     }

//     const read = () => {
//         return value;
//     }
//     const write = (newValue) => {
//         value = newValue;
//     }

//     return [read, write]
// }

function createEffect(fn) {
  const effect = {
    execute() {
      cleanup(effect);
      context.push(effect);
      fn();
      context.pop();
    },
    dependencies: new Set(),
  };

  effect.execute();
}

function createMemo(fn) {
  const [signal, setSignal] = createSignal();
  createEffect(() => setSignal(fn()));
  return signal;
}

/** @jsx render2 */

const globarr = [];
const map = new Map();

const dom = (eleType, props, ...children) => {
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    let ret = eleType(props, children);

    return ret;
  }

  const el = document.createElement(eleType);
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
      }
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

  (children || []).forEach((c) => {
    // console.log(el, c)
    addChild(c);
  });

  return el;
};

const render2 = (vNode) => {
  // create the element
  //   e.g. <div></div>
  const $el = document.createElement(vNode.tagName);

  // add all attributs as specified in vNode.attrs
  //   e.g. <div id="app"></div>
  for (const [k, v] of Object.entries(vNode.attrs)) {
    $el.setAttribute(k, v);
  }

  // append all children as specified in vNode.children
  //   e.g. <div id="app"><img></div>
  for (const child of vNode.children) {
    $el.appendChild(render2(child));
  }

  return $el;
};

// 28 sep

const Closure = (() => {
  let hooks = [];
  let idx = 0;
  const useState = (iv, cb) => {
    const state = hooks[idx] || iv;
    const _idx = idx;
    const setState = (nv) => {
      hooks[_idx] = nv;

      cb?.(nv);
    };
    idx++;
    return [state, setState];
  };

  const render = (C) => {
    idx = 0;
    // const c = C()
    console.log(C.render());
    // C.render()
    return C;
  };

  return { useState, render };
})();

function Compo() {
  const [s, sets] = Closure.useState("app", (nv) => {
    console.log("effect: updated", nv);
  });
  const [c, setc] = Closure.useState(0, (nv) => {
    console.log("effect: updated", nv);
  });

  const render = () => {
    // console.log('effect: c is updated', _c)
    return (
      <div>
        aksh {s}: {c}
      </div>
    );
  };

  return {
    render: render,
    updatec: (nv) => setc(nv),
    updates: (nv) => sets(nv),
  };
}

let c = Compo();

// console.log(Closure.render(c))

c.updates("mango");
c = Closure.render(c);
c.updatec(4000);
c = Closure.render(c);

// end 28-sep

const global = {
  a: 10,
};

function Global() {
  return <div>just some global {global.a}</div>;
}

function List(_state) {
  let state = {
    ..._state,
  };

  console.log(_state.arr);

  return state.uo ? (
    <ul>
      {" "}
      {(state?.arr || []).map((el) => {
        return <li>{el}</li>;
      })}
    </ul>
  ) : (
    <ol>
      {" "}
      {(state?.arr || []).map((el) => {
        return <li>{el}</li>;
      })}
    </ol>
  );
}

// new

function Input(_state) {
  const [t, sett] = createSignal("aksh");

  const update = (p) => {
    const input = document.querySelector("#test input");

    input.parentNode.replaceChild(render, input);
  };

  const render = (
    <input
      type="text"
      onChange={(e) => {
        sett(e.target.value);
        // update()
        // console.log(getFn(), state)
      }}
      value={t()}
      placeholder="your name"
    />
  );

  createEffect(() => {
    console.log("create effect");
    return render;
  });

  return render;
}

function Input2() {
  const [t, sett] = Closure.useState("aksh");

  return (
    <input
      type="text"
      onChange={(e) => {
        sett(e.target.value);
        // update()
        // console.log(getFn(), state)
      }}
      value={t}
      placeholder="your name"
    />
  );
}

// end

function Counter() {
  const _dom = document.getElementById("test");

  const update = () => {
    _dom.replaceChild(Counter(), _dom.firstChild);
  };

  // const [arr, setarr] = Closure.useState(null, update)
  const [ctr, setCtr] = Closure.useState(0, update);

  return (
    <div>
      hello world {ctr}
      <Input2 />
      <button
        onClick={() => {
          setCtr(ctr + 10);
        }}
      >
        incr
      </button>
    </div>
  );
}

document.getElementById("test").appendChild(<Counter />);

// https://dev.to/ycmjason/building-a-simple-virtual-dom-from-scratch-3d05
// https://codesandbox.io/s/vdommm-forked-4q29hq?file=/src/main.js  //my updated ver
