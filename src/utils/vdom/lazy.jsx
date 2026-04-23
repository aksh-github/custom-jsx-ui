/** @jsx h */
import { h, createEffect, createState } from "./vdom-lib";

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
    // return () => {
    //   if (clearOnUnmount) {
    //     delete suspenseCache[key];
    //   }
    // };
  }, []);

  if (err) {
    return <div>{error}</div>;
    // return render({ error: err, loading: false, data: null });
  }

  // if (!Comp) {
  //   // return <div>{error}</div>;
  //   return render({ error: null, loading: true, data: null });
  // }

  // return render({ error: null, loading: false, data: Comp });

  if (!Comp) {
    return <section>{fallback}</section>;
  }
  // pass only relevant props
  const { importFn: ifn, fallback: fb, error: er, resolve: re, ...p2 } = other;
  return <Comp {...p2} key={key} />;
}
