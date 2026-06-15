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
  // Normalize promise to always be an array of functions
  const promiseFns = Array.isArray(promise) ? promise : [promise];
  const isMultiple = promiseFns.length > 1;

  const Result = suspenseCache[key];

  // const [Result, , setResultSpl] = createState(suspenseCache[key]);

  const callPromise = Result === null ? false : true;

  const [promiseAll, , setPromiseAll] = createState(
    callPromise ? Promise.all(promiseFns.map((fn) => fn())) : null,
  );
  const [err, setErr] = createState(null);
  const [loading, setLoading] = createState(!suspenseCache[key]);

  if (Result) {
    return render({ result: isMultiple ? Result : Result[0] });
  }

  createEffect(() => {
    let isCurrent = true;

    setErr(null);
    setLoading(true);

    if (suspenseCache[key] === undefined) {
      suspenseCache[key] = null; // Mark as in-flight
    } else {
      return; // Skip if already in flight or resolved
    }

    promiseAll
      .then((returnVals) => {
        // returnVals is always an array from Promise.all
        const hasError = returnVals.some((val) => val instanceof Error);
        if (hasError) throw returnVals.find((val) => val instanceof Error);

        suspenseCache[key] = returnVals;

        if (!isCurrent) return;

        // setResultSpl(returnVals);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);

        if (!isCurrent) return;

        setErr(error);
        // setResultSpl(null);
        setLoading(false);
      });

    return () => {
      isCurrent = false;

      if (suspenseCache[key] === null) {
        suspenseCache[key] = undefined; // v imp step
        removeCacheForKey(key);
      }
    };
  }, [key, promiseAll]);

  if (err) return <div>{err}</div>;
  if (loading) return <div>{fallback}</div>;

  return render({ result: isMultiple ? Result : Result?.[0] });
}

export const removeCacheForKey = (key) => {
  // if used since delete is heavy op
  if (suspenseCache[key]) delete suspenseCache[key];
};
