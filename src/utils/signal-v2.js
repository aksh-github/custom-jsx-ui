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

  const effectInstance = { notify: execute, link };

  function link(unlink) {
    _unlinkSubscriptions.add(unlink);
  }

  function execute() {
    observerStack.push(null);
    try {
      dispose();
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

  execute();

  return dispose;
};

export function memo(fn) {
  const [sig, setSig] = signal();
  effect(() => setSig(fn()));
  return sig;
}

// Global stack to track the currently running computed function
const contextStack = [];

export function computed(fn) {
  let value;
  let isDirty = true;
  const subscribers = new Set();

  const computation = {
    // 2. Track all signal subscriber-sets this computation currently belongs to
    dependencies: new Set(),

    cleanup() {
      // 3. Remove this computation from all signal subscriber lists
      this.dependencies.forEach((subSet) => subSet.delete(this));
      this.dependencies.clear();
    },

    run() {
      if (!isDirty) {
        isDirty = true;
        // Do not clean up immediately here; wait until the value is actually read
        subscribers.forEach((sub) => sub.run());
      }
    },
  };

  return {
    get() {
      const currentComputation = contextStack[contextStack.length - 1];
      if (currentComputation) {
        subscribers.add(currentComputation);
        currentComputation.dependencies.add(subscribers);
      }

      if (isDirty) {
        // 4. Clear stale dependencies right before running the function again
        computation.cleanup();

        contextStack.push(computation);
        try {
          value = fn();
        } finally {
          contextStack.pop();
          isDirty = false;
        }
      }

      return value;
    },
  };
}
