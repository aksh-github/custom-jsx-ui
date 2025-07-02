// const log = console.log;
const log = () => {};

function _createEffect() {
  let prevDeps = [];
  let cleanupFn;
  let once = false;
  let firstRun = true;

  return (effectFn, dependencies) => {
    // skip effect when its not 0 deps
    // if (prevDeps?.length === dependencies?.length && dependencies?.length > 0) {
    //   prevDeps = dependencies;
    //   // firstRun = false;
    //   return;
    // }

    const dependenciesChanged = dependencies.some(
      (dep, i) => dep !== prevDeps?.[i]
    );

    // skip update effect for first run
    if (firstRun && dependencies?.length > 0) {
      firstRun = false;
      return;
    }

    // if (!prevDeps?.length || dependenciesChanged) {
    if (dependenciesChanged) {
      // if (cleanupFn) cleanupFn();
      // cleanupFn = effectFn();
      effectFn();
      prevDeps = dependencies;
    } else if (
      prevDeps?.length === dependencies?.length &&
      dependencies.length === 0
    ) {
      if (!once) {
        cleanupFn = effectFn(); // only for 0 deps
        once = true;
      }
    }

    return cleanupFn;
  };
}

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

export const updateComps = new Set();
export const updateCtx = new Set();

let currComp = null;
export const setCurrComp = (comp) => {
  currComp = comp;
};

let throtUpdate = null;
let forceUpdate = () => {};

const SimState = (() => {
  const globalState = {};

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
      log("update in state", lcurrComp);
      if (typeof valueOrFn === "function") {
        st = valueOrFn(st);
      } else {
        if (st == valueOrFn) {
          return;
        }
        st = { ...valueOrFn };
      }

      if (batchOp) {
        if (lcurrComp) updateComps.add(lcurrComp);
      } else if (isSkipping) {
      } else {
        // updateComps.push(lcurrComp);
        if (lcurrComp) updateComps.add(lcurrComp);
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
      log("update in atom", lcurrComp);
      if (typeof valueOrFn === "function") {
        st = valueOrFn(st);
      } else {
        if (st == valueOrFn) {
          return;
        }
        st = valueOrFn;
      }

      if (batchOp) {
        if (lcurrComp) updateComps.add(lcurrComp);
      } else if (isSkipping) {
      } else {
        // updateComps.push(lcurrComp);
        if (lcurrComp) updateComps.add(lcurrComp);
        throtUpdate();
      }
    };

    return [get, set];
  };

  const context = (iv) => {
    const [get, set] = atom(iv);

    return {
      get: () => get(),
      set: (valueOrFn) => {
        const old = get();
        skipUpdate(() => set(valueOrFn));
        if (old !== get()) {
          updateCtx.add(get());
          throtUpdate();
        }
      },
    };
  };

  return {
    batch,
    registerCallback,
    state,
    atom,
    context,
    skipUpdate,
  };
})();

export const registerCallback = SimState.registerCallback;
// export const batch = SimState.batch;
export const state = SimState.state;
export const atom = SimState.atom;
// export const skipUpdate = SimState.skipUpdate;
export const context = SimState.context;

// SmartState 27-jun-25

const SmartState = (() => {
  const gs = {};

  // for state
  let lastComp = null;
  let idx = 0;

  // for mount, change etc
  let fnLastComp = null;
  let fnIdx = 0;
  const mountMap = new Map();
  const unMountMap = new Map();

  let batchOp = false;
  let isSkipping = false;

  const batch = (cb) => {
    console.warn("untested code");
    batchOp = true;
    cb();
    batchOp = false;
    forceUpdate();
  };

  const registerCallback = (cb, duration = 100) => {
    forceUpdate = cb;
    throtUpdate = debounce(forceUpdate, duration);
  };

  const skipUpdate = (cb) => {
    isSkipping = true;
    cb();
    isSkipping = false;
  };

  // called for each component mount
  const init = () => {
    for (const [_key, fn] of mountMap) {
      const umt = fn();
      mountMap.set(_key, () => {});
      if (umt) unMountMap.set(_key, umt);
    }
  };

  const reset = (keysArr) => {
    // gs = {};
    lastComp = fnLastComp = null;
    idx = fnIdx = 0;

    if (!keysArr) return;

    keysArr.forEach((key) => {
      // call unmount
      for (const [_key, fn] of mountMap) {
        // console.log(_key);

        if (_key === key) {
          mountMap.delete(_key);

          unMountMap.get(_key)?.();
          unMountMap.delete(_key);
        }
      }
      // if (unMountMap.has(key)) {
      //   unMountMap.get(key)();
      //   unMountMap.delete(key);
      // }

      // clear data
      Object.keys(gs).forEach((_key) => {
        if (_key.startsWith(key)) {
          gs[_key] = null;
          delete gs[_key];
        }
        // console.log(gs);
      });
    });
  };

  const state = (iv) => {
    if (lastComp != currComp) {
      // lastComp = currComp;
      idx = 0;
    }
    const key = `${currComp}-${idx}`;
    let st = gs[key] || iv;
    let firstRun = gs[key] == undefined;

    if (firstRun) gs[key] = st;

    // if (gs[key] == undefined) gs[key] = st;

    const get = () => {
      return gs[key];
    };

    const set = (nv) => {
      let temp;

      if (typeof nv === "function") {
        temp = nv(gs[key]);
      } else {
        temp = nv;
      }

      if (temp === gs[key]) return;

      gs[key] = temp;

      lastComp = key.split("-")?.[0];

      if (batchOp) {
        if (lastComp) updateComps.add(lastComp);
      } else if (isSkipping) {
      } else {
        // updateComps.push(lastComp);
        if (lastComp) updateComps.add(lastComp);
        reset();

        throtUpdate();
      }
      lastComp = null;

      // console.log("gs", gs);
    };

    const specialSet = (nv) => {
      if (gs[key] === nv) return;

      lastComp = key.split("-")?.[0];
      reset();
      gs[key] = nv;
      throtUpdate();
      lastComp = null;
    };

    // console.log("gs", gs);

    if (lastComp != currComp) lastComp = currComp;

    idx++;

    return [get(), set, specialSet];
  };

  const effect = (cb, deps) => {
    if (fnLastComp != currComp) {
      // lastComp = currComp;
      fnIdx = 0;
    }

    // for mount only logic
    if (deps?.length === 0) {
      if (!mountMap.has(`${currComp}`)) {
        mountMap.set(`${currComp}`, cb);
      }
      fnIdx = 0;
      return;
    }

    const key = `${currComp}-fn-${fnIdx}`;

    if (!gs[key]) {
      const fn = _createEffect();
      gs[key] = fn;
    }
    const unMountFn = gs[key](cb, deps);
    if (deps?.length === 0) {
      gs[key] = () => {};
      if (unMountFn) unMountMap.set(key, unMountFn);
    }

    if (fnLastComp != currComp) fnLastComp = currComp;

    fnIdx++;
  };

  return {
    state,
    init,
    reset,
    skipUpdate,
    batch,
    registerCallback,
    effect,
  };
})();

export const createState = SmartState.state;
export const init = SmartState.init;
export const reset = SmartState.reset;
export const skipUpdate = SmartState.skipUpdate;
export const batch = SmartState.batch;
export const smartRegisterCallback = SmartState.registerCallback;
export const createEffect = SmartState.effect;

// export const specialSet = SmartState.specialSet;
