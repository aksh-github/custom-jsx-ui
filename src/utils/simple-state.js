// const log = console.log;
const log = () => {};

const isServer = typeof window === "undefined";
const noop = () => {};

// function _createEffect() {
//   let prevDeps = [];
//   let cleanupFn;
//   let once = false;
//   let firstRun = true;

//   return (effectFn, dependencies) => {
//     // skip update effect for first run
//     if (firstRun && dependencies?.length > 0) {
//       firstRun = false;
//       // return;
//     }

//     const dependenciesChanged = dependencies.some(
//       (dep, i) => dep !== prevDeps?.[i],
//     );

//     // if (!prevDeps?.length || dependenciesChanged) {
//     if (dependenciesChanged) {
//       if (cleanupFn) cleanupFn();
//       cleanupFn = effectFn();
//       // effectFn();
//       prevDeps = dependencies;
//     } else if (
//       prevDeps?.length === dependencies?.length &&
//       dependencies.length === 0
//     ) {
//       if (!once) {
//         cleanupFn = effectFn(); // only for 0 deps
//         once = true;
//       }
//     }

//     return cleanupFn;
//   };
// }

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

  // except mount and unmount
  const effects = {}; // { "CompA": [ {prevDeps, cleanup}, ... ] }

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

      // mount unmount only etc
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

        // for other effects
        effects[key]?.forEach((slot) => {
          slot.cleanup?.();
          slot.prevDeps = null;
          slot.cleanup = null;
        });

        if (effects[key]) effects[key] = null;

        // clear data
        // delete gs[key];  //slower
        if (gs[key]) gs[key] = null; //faster
        // old
        // Object.keys(gs).forEach((_key) => {
        //   if (_key.startsWith(key)) {
        //     // if (Array.isArray(gs[_key])) gs[_key].length = 0;
        //     // else gs[_key] = null;

        //     delete gs[_key];
        //   }
        //   // console.log(gs);
        // });

        // clear refs
        refs[key]?.__clean?.();
        // delete refs[key]; //slower
        if (refs[key]) refs[key] = null; //faster

        // old
        // Object.keys(refs).forEach((_key) => {
        //   if (_key.startsWith(key)) {
        //     // if (Array.isArray(gs[_key])) gs[_key].length = 0;
        //     // else gs[_key] = null;
        //     refs[_key]?.__clean?.();
        //     delete refs[_key];
        //   }
        //   // console.log(gs);
        // });
      });
    }
  };

  const state = (iv) => {
    if (lastComp != currComp) {
      // lastComp = currComp;
      idx = 0;
    }
    // const key = `${currComp}-${idx}`;
    const cc = currComp;
    const lidx = idx;

    // Initialize component bucket if needed
    if (!gs[cc]) gs[cc] = [];

    if (gs[cc][idx] == undefined) gs[cc][lidx] = iv;

    const get = () => {
      // log(cc);
      return gs[cc][lidx];
    };

    const set = isServer
      ? () => {}
      : (nv) => {
          // log(cc, gs);
          let temp;

          if (typeof nv === "function") {
            temp = nv(gs[cc][lidx]);
          } else {
            temp = nv;
          }

          if (temp === gs[cc][lidx]) return;

          gs[cc][lidx] = temp;

          lastComp = cc;

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
      if (gs[cc][lidx] === nv) return;

      // lastComp = key.split("-")?.[0];
      lastComp = cc;

      // reset();
      gs[cc][lidx] = nv;

      throtUpdate();
      lastComp = null;
    };

    // console.log("gs", gs);

    if (lastComp != currComp) lastComp = currComp;

    idx++;

    return [/*gs[key]*/ get(), set, specialSet];
  };

  const ref = (iv) => {
    // log(refs);

    if (lastComp != currComp) {
      // lastComp = currComp;
      refIdx = 0;
    }

    const cc = currComp;
    const lidx = refIdx;

    // Initialize component bucket if needed
    if (!refs[cc]) refs[cc] = [];

    if (refs[cc][refIdx] == undefined) refs[cc][lidx] = iv;

    const setRef = (nv) => {
      let temp;

      // for dom this is not reqd
      // if (typeof nv === "function") {
      //   temp = nv(refs[key]);
      // } else {
      //   temp = nv;
      // }

      temp = nv;

      if (temp === refs[cc][lidx]) return;

      refs[cc][lidx] = temp;

      lastComp = cc; //key.split("-")?.[0];

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

    return [refs[cc][lidx], setRef];
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
      // log("get in context", currComp);

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
        if (fnLastComp !== currComp) {
          fnLastComp = currComp;
          fnIdx = 0;
        }

        // mount-only: no deps tracking needed, just store cb for init()
        if (deps?.length === 0) {
          if (!mountMap.has(currComp)) mountMap.set(currComp, cb);
          return;
        }

        if (!effects[currComp]) effects[currComp] = [];

        const i = fnIdx;
        fnIdx++;

        // first render — initialize slot, don't run yet
        if (!effects[currComp][i]) {
          effects[currComp][i] = { prevDeps: null, cleanup: null };
          // fall through instead of returning
        }

        const slot = effects[currComp][i];
        const depsChanged =
          deps == null ||
          slot.prevDeps === null || // ← null means first run, always execute
          deps.some((d, j) => d !== slot.prevDeps[j]);

        if (depsChanged) {
          slot.cleanup?.();
          slot.cleanup = cb() ?? null;
          slot.prevDeps = deps;
        }
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
