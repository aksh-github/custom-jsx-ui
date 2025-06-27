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
