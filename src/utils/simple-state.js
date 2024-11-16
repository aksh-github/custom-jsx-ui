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
  const batch = (cb) => {
    console.warn("untested code");
    batchOp = true;
    cb();
    batchOp = false;
    forceUpdate();
  };

  let throtUpdate = null;

  let forceUpdate = () => {};
  let batchOp = false;
  let isSkipping = false;

  const registerCallback = (cb, duration = 100) => {
    forceUpdate = cb;
    throtUpdate = debounce(forceUpdate, duration);
  };

  const skipUpdate = (flag) => {
    isSkipping = flag;
  };

  const state = (iv) => {
    let st = {
      ...iv,
    };

    const get = (key) => {
      return key ? st[key] : st;
    };

    const set = (valueOrFn) => {
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
    let st = iv;

    const get = () => {
      return st;
    };

    const set = (valueOrFn) => {
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
  };
})();

export const registerCallback = SimState.registerCallback;
export const batch = SimState.batch;
export const state = SimState.state;
export const atom = SimState.atom;
export const skipUpdate = SimState.skipUpdate;
