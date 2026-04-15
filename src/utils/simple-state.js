// const log = console.log;
const log = () => {};

const isServer = typeof window === "undefined";
const noop = () => {};

function _createEffect() {
  let prevDeps = [];
  let cleanupFn;
  let once = false;
  let firstRun = true;

  return (effectFn, dependencies) => {
    // skip update effect for first run
    if (firstRun && dependencies?.length > 0) {
      firstRun = false;
      return;
    }

    const dependenciesChanged = dependencies.some(
      (dep, i) => dep !== prevDeps?.[i],
    );

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
// export const updateCtx = new Set();

let currComp = null;
export const setCurrComp = (comp) => {
  currComp = comp;
};

// let throtUpdate = isServer ? noop : null;
let throtUpdate = noop;
let forceUpdate = isServer ? noop : () => {};

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

  // for context
  const gCtx = {};
  let ctxIdx = 0;

  // for refs
  const refs = {};
  let refIdx = 0;

  let batchOp = false;
  let isSkipping = false;

  const batch = (cb) => {
    console.warn("untested code");
    batchOp = true;
    cb();
    batchOp = false;
    forceUpdate();
  };

  const registerCallback = isServer
    ? noop
    : (cb, duration = 100) => {
        forceUpdate = cb;
        // throtUpdate = debounce(forceUpdate, duration);
        throtUpdate = forceUpdate;
      };

  const skipUpdate = (cb) => {
    isSkipping = true;
    cb();
    isSkipping = false;
  };

  // called for each component mount
  const init = isServer
    ? noop
    : () => {
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

    // reset context
    ctxIdx = 0;
    Object.entries(gCtx).forEach(([key, fn]) => {
      fn();
      delete gCtx[key];
    });

    // reset refs
    refIdx = 0;

    if (isServer) {
      mountMap.clear();
      unMountMap.clear();

      // clear data
      Object.keys(gs).forEach((key) => {
        delete gs[key];
      });

      log("gs in reset", gs);
    } else {
      if (!keysArr) return;

      // mount unmount etc
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
        // unMountMap.get(key)();
        // unMountMap.delete(key);
        // }

        // clear data
        Object.keys(gs).forEach((_key) => {
          if (_key.startsWith(key)) {
            // if (Array.isArray(gs[_key])) gs[_key].length = 0;
            // else gs[_key] = null;

            delete gs[_key];
          }
          // console.log(gs);
        });

        // clear refs
        Object.keys(refs).forEach((_key) => {
          if (_key.startsWith(key)) {
            // if (Array.isArray(gs[_key])) gs[_key].length = 0;
            // else gs[_key] = null;
            refs[_key]?.__clean?.();
            delete refs[_key];
          }
          // console.log(gs);
        });
      });
    }
  };

  const state = (iv) => {
    log(gs);
    if (lastComp != currComp) {
      // lastComp = currComp;
      idx = 0;
    }
    const key = `${currComp}-${idx}`;
    // let st = gs[key] || iv;
    // let firstRun = gs[key] == undefined;

    // if (firstRun) gs[key] = st;

    if (gs[key] == undefined) gs[key] = iv;

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

      if (isSkipping) {
      } else {
        if (lastComp) updateComps.add(lastComp);

        if (!batchOp) {
          // reset();

          throtUpdate();
        }
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

    return [gs[key], set, specialSet];
  };

  const ref = (iv) => {
    log(refs);

    if (lastComp != currComp) {
      // lastComp = currComp;
      refIdx = 0;
    }

    const key = `${currComp}-${refIdx}`;

    if (refs[key] == undefined) refs[key] = iv;

    const setRef = (nv) => {
      let temp;

      if (typeof nv === "function") {
        temp = nv(refs[key]);
      } else {
        temp = nv;
      }

      if (temp === refs[key]) return;

      refs[key] = temp;

      lastComp = key.split("-")?.[0];

      if (isSkipping) {
      } else {
        if (lastComp) updateComps.add(lastComp);

        if (!batchOp) {
          // reset();

          throtUpdate();
        }
      }
      lastComp = null;

      // console.log("gs", gs);
    };

    if (lastComp != currComp) lastComp = currComp;

    refIdx++;

    return [refs[key], setRef];
  };

  const context = (iv) => {
    // if (!globalState[currComp]) globalState[currComp] = [];
    if (currComp)
      throw new Error("Context cannot be created inside a component");

    // globalState[currComp].push(iv);
    let st = iv;
    let updated = false;

    // ctxIdx++;

    const get = () => {
      log("get in context", currComp);

      // changed on 20 Dec
      if (updated && currComp) {
        updateComps.add(currComp);
        // updated = false;
      }
      // if (currComp) updateComps.add(currComp);

      return st;
    };

    const set = (nv) => {
      let temp;

      if (typeof nv === "function") {
        temp = nv(st);
      } else {
        temp = nv;
      }

      if (temp === st) return;

      st = temp;

      if (isSkipping) {
      } else {
        updated = true;
        gCtx[ctxIdx++] = () => {
          updated = false;
        };

        if (!batchOp) {
          // reset();

          throtUpdate();
        }
      }
    };

    return { get, set };
  };

  const effect = isServer
    ? noop
    : (cb, deps) => {
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
    context,
    ref,
    init,
    reset,
    skipUpdate,
    batch,
    registerCallback,
    effect,
  };
})();

export const createState = SmartState.state;
export const createContext = SmartState.context;
export const createRef = SmartState.ref;
export const init = SmartState.init;
export const reset = SmartState.reset;
// export const resetForServer = SmartState.resetForServer;
export const skipUpdate = SmartState.skipUpdate;
export const batch = SmartState.batch;
export const smartRegisterCallback = SmartState.registerCallback;
export const createEffect = SmartState.effect;

// export const specialSet = SmartState.specialSet;
