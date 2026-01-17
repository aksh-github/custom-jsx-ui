import { forceUpdate, createState, setCurrComp } from "./vdom-lib";

const map = new Map();

/**
 * Makes an API call using a user-provided function and returns loading state, data, and error.
 *
 * @param {function} apiCallFn - User-provided function that makes the API call
 * @returns {object} - { loading, data, error }
 */
export const loader = (apiCallFn, forceRefresh) => {
  let _data = null;

  // if (map.has(apiCallFn) && !forceRefresh) {
  //   return map.get(apiCallFn);
  // }

  // map.set(apiCallFn, { loading: true, data: null, error: null });

  setCurrComp(`@loader:${apiCallFn.name || "anonymous"}`);
  const [data, setData] = createState(null);
  setCurrComp(null);
  if (data && !forceRefresh) {
    return { loading: false, data, error: null };
  }

  const fetch = async () => {
    try {
      _data = await apiCallFn();
      if (_data.ok) _data = await _data.json();
      // map.set(apiCallFn, { loading: false, data: _data, error: null });
    } catch (err) {
      // map.set(apiCallFn, { loading: false, data: _data, error: err });
    } finally {
      // loading = false;
      // forceUpdate();
      setData(_data);
    }
  };

  if (typeof window !== "undefined") fetch();

  return { loading: true, data: null, error: null };
};
