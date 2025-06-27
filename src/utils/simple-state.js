// const log = console.log;
const log = () => {};

export function createEffect() {
  let prevDeps = [];
  let cleanup;

  return function effect(effect, deps) {
    const depsChanged = deps.some((dep, index) => dep !== prevDeps[index]);

    if (!prevDeps.length || depsChanged) {
      if (cleanup) cleanup();
      cleanup = effect();
      prevDeps = deps;
    }
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
export const batch = SimState.batch;
export const state = SimState.state;
export const atom = SimState.atom;
export const skipUpdate = SimState.skipUpdate;
export const context = SimState.context;

// SmartState 27-jun-25

const SmartState = (() => {
  const gs = {};
  let lastComp = null;
  let idx = 0;

  const reset = (key) => {
    // gs = {};
    lastComp = null;
    idx = 0;

    Object.keys(gs).forEach((_key) => {
      if (_key.startsWith(key)) {
        gs[_key] = null;
        delete gs[_key];
      }
      // console.log(_key, key, _key.startsWith(key));
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
      if (gs[key] === nv) return;

      reset();
      gs[key] = typeof nv === "function" ? nv(gs[key]) : nv;
      throtUpdate();
    };

    const specialSet = (nv) => {
      if (gs[key] === nv) return;
      reset();
      gs[key] = nv;
      throtUpdate();
    };

    console.log("gs", gs);

    if (lastComp != currComp) lastComp = currComp;

    idx++;

    return [get(), set, specialSet];
  };

  return {
    state,
    reset,
  };
})();

export const createState = SmartState.state;
export const reset = SmartState.reset;
// export const specialSet = SmartState.specialSet;
