// orig is from no-framework-js -> no-framework-with-jsx project
import { updateScheduler } from "@dom-lib";

const observerStack = [];
let isBatching = false;
let pendingNotifications = new Set();

function getActiveObserver() {
  return observerStack[observerStack.length - 1] || null;
}

export const signal = (value) => {
  let _value = value;
  const _subscribers = new Set();

  function unlink(dep) {
    _subscribers.delete(dep);
  }

  function read() {
    const activeObserver = getActiveObserver();
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
      if (isBatching) {
        pendingNotifications.add(subscriber);
      } else {
        subscriber.notify();
      }
    }

    if (!isBatching) {
      updateScheduler.schedule();
    }
  }

  return [read, write];
};

export const batch = (fn) => {
  const wasBatching = isBatching;
  isBatching = true;

  try {
    fn();
  } finally {
    isBatching = wasBatching;

    if (!wasBatching && pendingNotifications.size > 0) {
      // Notify all pending effects
      for (const subscriber of pendingNotifications) {
        subscriber.notify();
      }
      pendingNotifications.clear();
      updateScheduler.schedule();
    }
  }
};

export const effect = (cb) => {
  let _externalCleanup; // defined explicitly by user
  let _unlinkSubscriptions = new Set(); // track active signals (to unlink on re-run)
  let stopped = false;

  const effectInstance = { notify, link };

  function notify() {
    if (!stopped) execute();
  }

  function link(unlink) {
    if (stopped) return;
    _unlinkSubscriptions.add(unlink);
  }

  function cleanup() {
    const externalCleanup = _externalCleanup;
    _externalCleanup = undefined;

    for (const unlink of _unlinkSubscriptions) {
      unlink(effectInstance);
    }
    _unlinkSubscriptions.clear();

    if (typeof externalCleanup === "function") {
      externalCleanup();
    }
  }

  function execute() {
    if (stopped) return;

    observerStack.push(null);
    try {
      cleanup();
    } finally {
      observerStack.pop();
    }

    observerStack.push(effectInstance);
    try {
      _externalCleanup = cb();
    } finally {
      observerStack.pop();
    }
  }

  function dispose() {
    if (stopped) return;
    stopped = true;
    pendingNotifications.delete(effectInstance);
    cleanup();
  }

  execute();

  return dispose;
};

export function memo(fn) {
  const [sig, setSig] = signal();
  const stop = effect(() => setSig(fn()));
  sig.dispose = stop;
  sig.stop = stop;
  return sig;
}

export function computed(fn) {
  if (typeof fn !== "function") {
    const [sig] = signal();
    sig.dispose = () => {};
    sig.stop = sig.dispose;
    return sig;
  }

  return memo(fn);
}
