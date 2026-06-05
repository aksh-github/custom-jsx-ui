// orig is from no-framework-js -> no-framework-with-jsx project
import { updateScheduler } from "@dom-lib";

const observerStack = [];
let isBatching = false;
let pendingNotifications = new Set();

function getActiveObserver() {
  return observerStack[observerStack.length - 1] || null;
}

export const untracked = (fn) => {
  observerStack.push(null);
  try {
    return fn();
  } finally {
    observerStack.pop();
  }
};

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

    // Snapshot subscribers before notifying — a subscriber's notify() may
    // cause it to unsubscribe or add new subscribers mid-loop.
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
      // FIX: Snapshot pendingNotifications before iterating.
      //
      // Without this, a notified effect that writes to a signal re-enters this
      // loop by adding new entries to pendingNotifications mid-iteration,
      // which can cause missed notifications or infinite loops depending on the
      // JS engine's Set iteration order guarantees.
      //
      // Additionally, clear the shared set *before* notifying so that any
      // signals written during notification queue into a clean set and are
      // flushed by a subsequent scheduler tick rather than the current loop.
      const toNotify = [...pendingNotifications];
      pendingNotifications.clear();

      // FIX: Wrap notification loop in try/finally so that a throwing effect
      // does not leave stale entries in pendingNotifications forever.
      try {
        for (const subscriber of toNotify) {
          subscriber.notify();
        }
      } finally {
        // Any entries that were re-added during notification (from nested
        // signal writes) remain in pendingNotifications for the next flush.
        updateScheduler.schedule();
      }
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

    // Run cleanup in untracked context so cleanup logic cannot accidentally
    // subscribe this effect to new signals.
    observerStack.push(null);
    try {
      cleanup();
    } finally {
      observerStack.pop();
    }

    // FIX: If cb() throws, the effect must still be removed from the observer
    // stack and marked as stopped so it does not silently re-execute with a
    // broken, partially-subscribed state on the next notification.
    //
    // Subscriptions gathered before the throw are cleaned up immediately via
    // the dispose() path so the effect does not leak signal references.
    observerStack.push(effectInstance);
    try {
      _externalCleanup = cb();
    } catch (err) {
      // Effect threw — stop it to prevent repeated execution in a broken state
      // and release all signal subscriptions to avoid memory leaks.
      stopped = true;
      pendingNotifications.delete(effectInstance);

      // Unlink subscriptions collected during this failed run.
      for (const unlink of _unlinkSubscriptions) {
        unlink(effectInstance);
      }
      _unlinkSubscriptions.clear();

      throw err; // Re-throw so callers can handle / log the error.
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

// memo() and computed() return the read function directly — consistent with
// how signal() works, where the read fn is just called as sig(). This lets
// computed values compose naturally: computed(() => otherComputed().length).
//
// dispose/stop are attached as non-enumerable properties on the function so
// they are available for cleanup without appearing in for..in loops or
// accidental spreads.

export function memo(fn) {
  const [read, setSig] = signal();
  const stop = effect(() => setSig(fn()));
  Object.defineProperties(read, {
    dispose: { value: stop, writable: true, configurable: true },
    stop: { value: stop, writable: true, configurable: true },
  });
  return read;
}

export function computed(fn) {
  if (typeof fn !== "function") {
    // FIX: Previously this created a signal and returned it without warning,
    // silently swallowing a likely programmer error. Now we throw early so the
    // mistake surfaces immediately rather than producing a broken computed that
    // always returns undefined.
    throw new TypeError(
      `computed() expects a function, got ${typeof fn}. ` +
        `Use signal() directly if you want a writable reactive value.`,
    );
  }

  return memo(fn);
}
