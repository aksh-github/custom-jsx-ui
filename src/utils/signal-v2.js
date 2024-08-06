// orig is from no-framework-js -> no-framework-with-jsx project

let activeObserver = null;
let forceUpdate = () => {};

export const registerRenderCallbackV2 = (cb) => {
  forceUpdate = cb;
};

export const signal = (value) => {
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

    forceUpdate();
  }

  return [read, write];
};

export const effect = (cb) => {
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
      console.log("in dispose for");
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

export function memo(fn) {
  const [sig, setSig] = signal();
  effect(() => setSig(fn()));
  return sig;
}
