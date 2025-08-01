import { createState } from "../simple-state";

function memo(Component, _key) {
  return function MemoizedComponent(props) {
    const key = props?.key || _key;

    if (key === undefined || key === null) {
      throw new Error(
        "memo component requires a unique key as the second argument"
      );
    }

    // let cached = cache[key];
    const [cached, setCached] = createState(null);

    if (!cached || !shallowEqual(cached.props, props)) {
      setCached({
        props,
        component: Component(props),
      });
    }

    return cached?.component || null;
  };
}

function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}
export { memo };
