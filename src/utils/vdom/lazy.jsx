/** @jsx h */
import { h, createEffect, createState } from "./vdom-lib";

const suspenseCache = {};

function Loader({ fallback }) {
  return fallback;
}

export function Lazy({ key, importFn, fallback, error, ...props }, child) {
  if (!importFn) throw Error("importFn is mandatory");

  const [Comp, , setCompSpl] = createState(suspenseCache[key]);
  const [res, , setResSpl] = createState(null);
  const [err, setErr] = createState(null);

  createEffect(() => {
    if (importFn && !Comp) {
      importFn()
        .then((mod) => {
          // console.log("Lazy component loaded:", mod);
          let C = (suspenseCache[key] =
            mod[props.resolve] || mod.default || mod);
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
  }

  if (!Comp && !res) {
    // return { type: "div", props: {}, children: [fallback] };
    return <div>{fallback}</div>;
  }
  // pass only relevant props
  const { importFn: ifn, fallback: fb, error: er, resolve: re, ...p2 } = props;
  return <Comp {...p2} key={key} />;
}
