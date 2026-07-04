const log = console.log;
// const log = () => {};

const isServer = typeof window === "undefined";
const noop = () => {};

// function debounce(func, duration) {
//   let timeout;

//   return function (...args) {
//     const effect = () => {
//       timeout = null;
//       return func.apply(this, args);
//     };

//     clearTimeout(timeout);
//     timeout = setTimeout(effect, duration);
//   };
// }

let pendingEffects = [];
let flushingEffects = false;

export function flushEffects() {
  if (flushingEffects) return;

  flushingEffects = true;

  const run = () => {
    const queue = pendingEffects.splice(0);
    flushingEffects = false;

    for (const fn of queue) {
      fn();
    }

    if (pendingEffects.length) {
      run();
    }
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 50 });
  } else {
    setTimeout(run, 0);
  }
}

export const updateComps = new Set();
// export const updateCtx = new Set();

let currComp = null;
export const setCurrComp = (comp) => {
  currComp = comp;
};

// let throtUpdate = isServer ? noop : null;
let throtUpdate = isServer
  ? noop
  : () => {
      if (typeof forceUpdate === "function") forceUpdate();
    };
let forceUpdate = isServer ? noop : () => {};

// SmartState 27-jun-25

const SmartState = (() => {
  // for state
  const gs = {};
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

  // for promiseCache
  const promiseCache = {};
  const promiseMeta = {}; // just to track if compo exists or unmounted
  let promIdx = 0;

  // for streams
  const streamState = {};
  const streamMeta = {}; // just to track if compo exists or unmounted
  let strmIdx = 0;

  let batchOp = false;
  let isSkipping = false;
  let hasPendingUpdate = false;

  const scheduleUpdate = (comp) => {
    if (isServer || batchOp || isSkipping) return;

    if (comp) updateComps.add(comp);

    if (hasPendingUpdate) return;

    hasPendingUpdate = true;

    const run = () => {
      hasPendingUpdate = false;
      throtUpdate();
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(run);
    } else {
      Promise.resolve().then(run);
    }
  };

  const batch = (cb) => {
    console.warn("untested code");
    batchOp = true;
    cb();
    batchOp = false;
    scheduleUpdate();
  };

  const registerCallback = isServer
    ? noop
    : (cb, duration = 100) => {
        forceUpdate = cb;
        throtUpdate = () => {
          if (typeof forceUpdate === "function") forceUpdate();
        };
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

    // reset promise
    promIdx = 0;

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

        //faster
        // if (gs[key]) {
        //   gs[key].forEach((slot) => slot?._cancel?.()); // cancel running promises if any
        //   gs[key] = null;
        // }
        if (gs[key]) gs[key] = null;

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
        // refs[key]?.__clean?.();  // no more reqd becos effect with deps now return cleanup funcs
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

        // for promises
        promiseMeta[key] = false; // to signal compo nomore exists

        // for streams
        if (streamState[key]) {
          streamState[key].forEach((it) => {
            it?.controller?.abort();
          });

          streamState[key] = null;
        }
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

          if (!isSkipping) {
            scheduleUpdate(lastComp);
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

      scheduleUpdate(cc);
      lastComp = null;
    };

    // console.log("gs", gs);

    if (lastComp != currComp) lastComp = currComp;

    idx++;

    return [/*gs[key]*/ get(), set, specialSet];
  };

  const resource = (iv, deps = null) => {
    if (lastComp != currComp) {
      // lastComp = currComp;
      promIdx = 0;
    }

    const resp = { loading: true, result: null, error: null };

    if (isServer) {
      return resp;
    }

    // const key = `${currComp}-${idx}`;
    const cc = currComp;
    const lidx = promIdx;

    // Initialize component bucket if needed
    if (!promiseCache[cc]) promiseCache[cc] = [];
    promiseMeta[cc] = true;

    const cached = promiseCache[cc][lidx];

    const depsChanged =
      deps !== null &&
      (!cached ||
        !cached._deps ||
        deps.length !== cached._deps.length ||
        deps.some((d, i) => d !== cached._deps[i]));

    // log(depsChanged);

    if (promiseCache[cc][lidx] == undefined || depsChanged) {
      const resp = {
        loading: true,
        result: null,
        error: null,
        _deps: deps,
        refreshing: depsChanged ? true : null,
      };
      promiseCache[cc][lidx] = resp;

      const promise = iv();
      if (promise instanceof Promise) {
        promiseCache[cc][lidx] = resp;
        promise
          .then((res) => {
            // log(res);
            // promiseCache[cc][lidx] = res;

            if (res instanceof Error) throw res;

            promiseCache[cc][lidx] = {
              ...resp,
              loading: false,
              refreshing: false,
              result: res,
              error: null,
              _deps: deps,
            };
          })
          .catch((err) => {
            promiseCache[cc][lidx] = {
              ...resp,
              loading: false,
              refreshing: false,
              result: null,
              error: err,
              _deps: deps,
            };
          })
          .finally(() => {
            if (!isSkipping && promiseMeta[cc]) {
              scheduleUpdate(cc);
            }
            lastComp = null;
          });
      }
    }

    // console.log("gs", gs);

    if (lastComp != currComp) lastComp = currComp;

    promIdx++;

    // return [/*gs[key]*/ get(), set, specialSet];
    return promiseCache[cc][lidx];
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

      if (!isSkipping) {
        scheduleUpdate(lastComp);
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

    // only once: for a given context this part will be exec only once
    if (currComp)
      throw new Error("Context cannot be created inside a component");

    // globalState[currComp].push(iv);
    let st = iv;
    let updated = false;

    // end only once

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

      if (!isSkipping) {
        updated = true;
        gCtx[ctxIdx++] = () => {
          updated = false;
        };

        scheduleUpdate();
      }
    };

    const setFunction = (nv) => {
      let temp = nv;

      if (temp === st) return;

      st = temp;

      if (!isSkipping) {
        updated = true;
        gCtx[ctxIdx++] = () => {
          updated = false;
        };

        scheduleUpdate();
      }
    };

    return { get, set, setFunction };
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

        if (updateComps.has(currComp)) {
          const slot = effects[currComp][i];
          const depsChanged =
            deps == null ||
            slot.prevDeps === null || // ← null means first run, always execute
            deps.some((d, j) => d !== slot.prevDeps[j]);

          if (depsChanged) {
            slot.cleanup?.();
            slot.cleanup = null;
            slot.prevDeps = deps;

            // log(currComp);
            // if (updateComps.has(currComp)) {
            pendingEffects.push(() => {
              slot.cleanup = cb() ?? null;
            });
          }
        }
      };

  const stream = isServer
    ? noop
    : ({ topic, delimiter = "\n" }) => {
        if (lastComp != currComp) {
          // lastComp = currComp;
          strmIdx = 0;
        }

        // log(streamState);

        let resp = {
          loading: false,
          result: null,
          error: null,
          controller: null,
        };

        const cc = currComp;
        const lidx = strmIdx;

        // Initialize component bucket if needed
        if (!streamState[cc]) streamState[cc] = [];

        const start = async (tranformResponse, triggerUpdate) => {
          if (streamState[cc][lidx]?.loading) {
            return false;
          }

          streamState[cc][lidx] = {
            ...resp,
            loading: true,
            controller: new AbortController(),
          };

          try {
            const response = await fetch(`/api/stream?q=${topic}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal: streamState[cc][lidx].controller.signal, // Attach the abort signal to fetch
            });

            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(delimiter);
              buffer = lines.pop();

              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const jsonChunk = JSON.parse(line);
                    // setData((prev) => [...prev, jsonChunk]);

                    streamState[cc][lidx] = {
                      ...streamState[cc][lidx],
                      result: tranformResponse(
                        streamState[cc][lidx].result,
                        jsonChunk,
                      ),
                    };
                    // log(streamState[cc][lidx]);

                    if (triggerUpdate) {
                      scheduleUpdate(cc);
                    }
                  } catch (jsonErr) {
                    console.error("Failed parsing line to JSON:", line);
                  }
                }
              }
            }
          } catch (err) {
            // 3. Ignore the error if it was manually triggered by the user
            if (err.name === "AbortError") {
              console.log("Stream successfully aborted by user.");
            } else {
              log(err);
              streamState[cc][lidx] = {
                ...streamState[cc][lidx],
                error: err,
              };
              // setError(err.message || "Streaming request dropped.");
            }
          } finally {
            streamState[cc][lidx].controller.abort();
            streamState[cc][lidx] = {
              ...streamState[cc][lidx],
              loading: false,
            };

            scheduleUpdate(cc);

            lastComp = null;
          }
        };

        const stop = () => {
          streamState[cc][lidx].controller.abort();
          streamState[cc][lidx] = {
            ...streamState[cc][lidx],
            // result: finalOutput,
            loading: false,
          };

          // this is not required because finally block above will take care of it
          // scheduleUpdate(cc);
        };

        if (lastComp != currComp) lastComp = currComp;

        strmIdx++;

        return { ...streamState[cc][lidx], start, stop };
      };

  return {
    state,
    resource,
    context,
    ref,
    init,
    reset,
    skipUpdate,
    batch,
    registerCallback,
    effect,
    stream,
  };
})();

export const createState = SmartState.state;
export const createResource = SmartState.resource;
export const createContext = SmartState.context;
export const createRef = SmartState.ref;
export const init = SmartState.init;
export const reset = SmartState.reset;
// export const resetForServer = SmartState.resetForServer;
export const skipUpdate = SmartState.skipUpdate;
export const batch = SmartState.batch;
export const smartRegisterCallback = SmartState.registerCallback;
export const createEffect = SmartState.effect;
export const createStream = SmartState.stream;

// export const specialSet = SmartState.specialSet;
