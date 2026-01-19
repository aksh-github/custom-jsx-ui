import {
  h,
  forceUpdate,
  createState,
  setCurrComp,
  createEffect,
} from "./vdom-lib";

const map = new Map();

/**
 * Makes an API call using a user-provided function and returns loading state, data, and error.
 *
 * @param {function} apiCallFn - User-provided function that makes the API call
 * @returns {object} - { loading, data, error }
 */
// export const loader = (apiCallFn, forceRefresh) => {
//   let _data = null;

//   if (map.has(apiCallFn) && !forceRefresh) {
//     return map.get(apiCallFn);
//   }

//   // map.set(apiCallFn, { loading: true, data: null, error: null });

//   setCurrComp(`@loader:${apiCallFn.name || "anonymous"}`);
//   const [data, setData] = createState(null);
//   setCurrComp(null);
//   // if (data && !forceRefresh) {
//   //   return { loading: false, data, error: null };
//   // }

//   const fetch = async () => {
//     try {
//       _data = await apiCallFn();
//       if (_data.ok) _data = await _data.json();
//       map.set(apiCallFn, { loading: false, data: _data, error: null });
//     } catch (err) {
//       map.set(apiCallFn, { loading: false, data: _data, error: err });
//     } finally {
//       // loading = false;
//       // forceUpdate();
//       setData(_data);
//     }
//   };

//   if (typeof window !== "undefined") fetch();

//   return { loading: true, data: null, error: null };
// };

const dataCache = {};

export function Loader({ promiseFn, loading, error, onLoad, key }) {
  const [data, setData] = createState(dataCache[key]);
  const [err, setErr] = createState(null);

  if (!promiseFn) throw Error("promiseFn is mandatory");

  createEffect(() => {
    if (promiseFn) {
      promiseFn()
        .then((res) => res.json())
        .then((res) => {
          setData(res);
          if (key) {
            dataCache[key] = res;
          }
        })
        .catch((err) => {
          console.error(err);
          setErr(err);
          dataCache[key] = null;
        });
    }
  }, []);

  if (err) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>{loading}</div>;
  }
  return onLoad(data);
}
