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

const state = (iv) => {
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
        // forceUpdate();
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

export default state;
