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

let throtUpdate = null;

let forceUpdate = () => {};
let batchOp = false;

export const state = (iv) => {
  let st = {
    ...iv,
  };

  return {
    get: (key) => {
      return key ? st[key] : st;
    },
    set: (nv) => {
      st = {
        ...st,
        ...nv,
      };
      if (!batchOp) {
        // forceUpdate();
        // requestIdleCallback(forceUpdate);
        throtUpdate();
      }
    },
    reset: () => {
      st = {};
    },
    registerRenderCallback: (cb) => {
      forceUpdate = cb;
      throtUpdate = debounce(forceUpdate, 100);
    },
    batch: (cb) => {
      cb();
      batchOp = false;
    },
  };
};

export const atom = (iv) => {
  let st = iv;

  return {
    get: () => {
      return st;
    },
    set: (nv) => {
      st = nv;
      if (!batchOp) {
        // forceUpdate();
        // requestIdleCallback(forceUpdate);
        throtUpdate();
      }
    },
    reset: () => {
      st = null;
    },
    registerRenderCallback: (cb) => {
      forceUpdate = cb;
      throtUpdate = debounce(forceUpdate, 100);
    },
    batch: (cb) => {
      cb();
      batchOp = false;
    },
  };
};

// export state;
