/** @jsx h */
import { h, createEffect, createState } from "@vdom-lib";

const suspenseCache = {};

export function Lazy(
  { key, importFn, resolve, fallback, error, ...other },
  child,
) {
  if (!importFn) throw Error("importFn is mandatory");

  const [Comp, , setCompSpl] = createState(suspenseCache[key]);
  // const [res, , setResSpl] = createState(null);
  const [err, setErr] = createState(null);

  createEffect(() => {
    if (importFn && !Comp) {
      importFn()
        .then((mod) => {
          // console.log("Lazy component loaded:", mod);
          let C = (suspenseCache[key] = mod[resolve] || mod.default || mod);
          if (C && typeof C === "function") {
            setCompSpl(C);
          } else {
            suspenseCache[key] = null;
            setErr("Something wrong!!");
          }
        })
        .catch((err) => {
          console.error(err);
          suspenseCache[key] = null;
          setErr("Something wrong!!");
          setCompSpl(null);
        });
    } else {
      // fetchFn?.().then((res) => {
      //   setResSpl(res);
      // });
    }

    // Below doesn't work as expected
    return () => {
      // if (clearOnUnmount) {
      //   delete suspenseCache[key];
      // }
      delete suspenseCache[key];
    };
  }, []);

  if (err) {
    return <div>{error}</div>;
    // return error;
    // return render({ error: err, loading: false, data: null });
  }

  // if (!Comp) {
  //   // return <div>{error}</div>;
  //   return render({ error: null, loading: true, data: null });
  // }

  // return render({ error: null, loading: false, data: Comp });

  if (!Comp) {
    return <section>{fallback}</section>;
    // return fallback;
  }
  // pass only relevant props
  const { importFn: ifn, fallback: fb, error: er, resolve: re, ...p2 } = other;
  return <Comp {...p2} key={key} />;
}

export function LazyV2({ key, fallback, error, render, promise }) {
  const [Result, , setResultSpl] = createState(suspenseCache[key]);

  // call only if Result unavailable or it was never called
  const callPromise = Result || suspenseCache[key] === null ? false : true;

  const [promiseFn, , setPromiseFn] = createState(
    callPromise ? promise() : null,
  );
  const [err, setErr] = createState(null);
  const [loading, setLoading] = createState(!suspenseCache[key]);

  if (Result) {
    return render({ result: Result });
  }

  createEffect(() => {
    // Reset state when PromiseFn / key changes
    setErr(null);
    setLoading(true);

    if (suspenseCache[key] === undefined) {
      suspenseCache[key] = null;
    } else {
      // this promise is already in flight
      return;
    }

    // if (promiseFn instanceof Promise)
    promiseFn
      .then((returnVal) => {
        if (returnVal instanceof Error) {
          throw returnVal;
        }

        suspenseCache[key] = returnVal;
        setResultSpl(returnVal);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        suspenseCache[key] = null;
        setErr(error);
        setResultSpl(null);
        setLoading(false);
      });

    return () => {
      // delete suspenseCache[key];
      removeCacheForKey(key);
    };
  }, [key, promiseFn]); // Re-run when key changes

  if (err) {
    return <div>{err}</div>;
  }

  if (loading) {
    return <div>{fallback}</div>;
  }

  return render({ result: Result });
}

export const removeCacheForKey = (key) => {
  // if used since delete is heavy op
  if (suspenseCache[key]) delete suspenseCache[key];
};
