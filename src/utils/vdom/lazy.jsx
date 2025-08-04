import { createEffect, createState } from "../simple-state";
import { h } from "@vdom-lib";

export function Lazy({ importFn, fetchFn, fallback, ...props }) {
  const [Comp, , setCompSpl] = createState(null);
  const [res, , setResSpl] = createState(null);

  createEffect(() => {
    if (importFn) {
      importFn().then((mod) => {
        console.log("Lazy component loaded:", mod);
        setCompSpl(mod[props.resolve] || mod.default || mod);
      });
    } else {
      fetchFn().then((res) => {
        setResSpl(res);
      });
    }
  }, []);

  if (!Comp && !res) {
    return <div>{fallback}</div>;
  }
  return Comp ? <Comp {...props} __lazy /> : res;
}
