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

export const batch = (cb) => {
  console.warn("untested code");
  batchOp = true;
  cb();
  batchOp = false;
  forceUpdate();
};

let throtUpdate = null;

let forceUpdate = () => {};
let batchOp = false;

export const registerCallback = (cb) => {
  forceUpdate = cb;
  throtUpdate = debounce(forceUpdate, 100);
};

export const state = (iv) => {
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

    if (!batchOp) {
      // forceUpdate();
      // requestIdleCallback(forceUpdate);

      throtUpdate();
    }
  };

  return [get, set];
};

export const atom = (iv) => {
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

    if (!batchOp) {
      // forceUpdate();
      // requestIdleCallback(forceUpdate);

      throtUpdate();
    }
  };

  return [get, set];
};

// export state;
