function debounce(func, duration) {
  let timeout;

  return function (...args) {
    const effect = () => {
      timeout = null;
      return func.apply(this, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(effect, duration);
  };
}

const SimState = (() => {
  const globalState = {};

  let currComp = null;

  const setCurrComp = (comp) => {
    currComp = comp;
  };

  const batch = (cb) => {
    console.warn("untested code");
    batchOp = true;
    cb();
    batchOp = false;
    forceUpdate();
  };

  const skipUpdate = (cb) => {
    isSkipping = true;
    cb();
    isSkipping = false;
  };

  let throtUpdate = null;

  let forceUpdate = () => {};
  let batchOp = false;
  let isSkipping = false;

  const registerCallback = (cb, duration = 100) => {
    forceUpdate = cb;
    throtUpdate = debounce(forceUpdate, duration);
  };

  const state = (iv) => {
    // if (!globalState[currComp]) globalState[currComp] = [];

    // globalState[currComp].push(iv);

    let st = {
      ...iv,
    };

    let lcurrComp = currComp;

    const get = (key) => {
      return key ? st[key] : st;
    };

    const set = (valueOrFn) => {
      console.log("update in state", lcurrComp);
      if (typeof valueOrFn === "function") {
        st = valueOrFn(st);
      } else {
        if (st == valueOrFn) {
          return;
        }
        st = { ...valueOrFn };
      }

      if (batchOp || isSkipping) {
      } else {
        throtUpdate();
      }
    };

    return [get, set];
  };

  const atom = (iv) => {
    // if (!globalState[currComp]) globalState[currComp] = [];

    // globalState[currComp].push(iv);

    let st = iv;

    let lcurrComp = currComp;

    const get = () => {
      return st;
    };

    const set = (valueOrFn) => {
      console.log("update in state", lcurrComp);
      if (typeof valueOrFn === "function") {
        st = valueOrFn(st);
      } else {
        if (st == valueOrFn) {
          return;
        }
        st = valueOrFn;
      }

      if (batchOp || isSkipping) {
      } else {
        throtUpdate();
      }
    };

    return [get, set];
  };

  return {
    batch,
    registerCallback,
    state,
    atom,
    skipUpdate,
    setCurrComp,
  };
})();

export const registerCallback = SimState.registerCallback;
export const batch = SimState.batch;
export const state = SimState.state;
export const atom = SimState.atom;
export const skipUpdate = SimState.skipUpdate;
export const setCurrComp = SimState.setCurrComp;
