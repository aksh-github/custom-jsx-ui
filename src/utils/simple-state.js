let forceUpdate = () => {};
let batchOp = false;

const state = (iv) => {
  let st = {
    ...iv,
  };

  return {
    get: (key) => {
      return st[key];
    },
    set: (nv) => {
      st = {
        ...st,
        ...nv,
      };
      if (!batchOp) forceUpdate();
    },
    reset: () => {
      st = {};
    },
    registerRenderCallback: (cb) => {
      forceUpdate = cb;
    },
    batch: (cb) => {
      cb();
      batchOp = false;
    },
  };
};

export default state;
