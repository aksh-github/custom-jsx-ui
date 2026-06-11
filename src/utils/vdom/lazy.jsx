/** @jsx h */
import { h, createEffect, createState } from "@vdom-lib";

const suspenseCache = {};

function Loader({ fallback }) {
  return fallback;
}

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

export function LazyV2({ key, fallback, error }, children) {
  const Child = children[0];

  const [Comp, setComp, setCompSpl] = createState(suspenseCache[key]);
  const [isFunc, setIsFunc] = createState(false);
  const [err, setErr] = createState(null);
  const [loading, setLoading] = createState(!suspenseCache[key]);

  createEffect(() => {
    // Reset state when Child changes
    setErr(null);
    setLoading(true);

    // Handle both async component functions and direct promises
    const childPromise = typeof Child === "function" ? Child() : Child;

    if (childPromise instanceof Promise) {
      childPromise
        .then((returnVal) => {
          suspenseCache[key] = returnVal;
          if (returnVal instanceof Function) {
            if (returnVal.name !== "")
              console.warn("You're supposed to return annonymous function!!");
            setCompSpl(returnVal);
            setIsFunc(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          suspenseCache[key] = null;
          setErr(error);
          setComp(null);
          setLoading(false);
        });
    } else {
      // Child is not a promise, set it directly
      suspenseCache[key] = childPromise;
      setComp(childPromise);
      setLoading(false);
    }

    return () => {
      delete suspenseCache[key];
    };
  }, [key]); // Re-run when key changes

  if (err) {
    return <div>{err}</div>;
  }

  return (isFunc ? <Comp /> : Comp) || (loading && fallback);
}
