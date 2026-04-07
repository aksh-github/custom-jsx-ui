const log = () => {};

const isServer = typeof window === "undefined";
const noop = () => {};
export const updateComps = new Set();
let currComp = null;

let lastComp = null;
export const setCurrComp = (comp) => {
  currComp = comp;
};

let activeObserver = null;

export const createSignal = (value) => {
  let _value = value;
  const _subscribers = new Set();

  function unlink(dep) {
    _subscribers.delete(dep);
  }

  function read() {
    if (activeObserver && !_subscribers.has(activeObserver)) {
      _subscribers.add(activeObserver);
      activeObserver.link(unlink);
    }

    return _value;
  }

  function write(valueOrFn) {
    const newValue =
      typeof valueOrFn === "function" ? valueOrFn(_value) : valueOrFn;
    if (newValue === _value) return;
    _value = newValue;

    for (const subscriber of [..._subscribers]) {
      subscriber.notify();
    }
  }

  return [read, write];
};

export const createEffect = (cb) => {
  let _externalCleanup; // defined explicitly by user
  let _unlinkSubscriptions = new Set(); // track active signals (to unlink on re-run)

  const effectInstance = { notify: execute, link };

  function link(unlink) {
    _unlinkSubscriptions.add(unlink);
  }

  function execute() {
    dispose();
    activeObserver = effectInstance;
    _externalCleanup = cb();
    activeObserver = null;
  }

  function dispose() {
    for (const unlink of _unlinkSubscriptions) {
      unlink(effectInstance);
    }
    _unlinkSubscriptions.clear();

    if (typeof _externalCleanup === "function") {
      _externalCleanup();
    }
  }

  execute();

  return dispose;
};

let refIdx = 0;
const refs = {};
const isSkipping = false;

export function createRef(iv) {
  // log(refs);

  if (lastComp != currComp) {
    // lastComp = currComp;
    refIdx = 0;
  }

  const key = `${currComp}-${refIdx}`;

  if (refs[key] == undefined) refs[key] = iv;

  const getRef = (iv) => {
    return refs[key];
  };

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
        // throtUpdate();
      }
    }
    lastComp = null;

    // console.log("gs", gs);
  };

  if (lastComp != currComp) lastComp = currComp;

  refIdx++;

  return [refs[key], setRef];
}
