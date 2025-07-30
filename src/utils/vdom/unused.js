// meta answer to locate obj in json and also gives path
// on 17 nov 24

// use it as
// const matches = findMatchingObjects(vdomjson, "key", "value");

function findMatchingObjects(json, key, value) {
  const matches = [];

  // Recursive function to traverse the JSON object
  function traverse(obj, path) {
    // Check if the object has the matching key-value pair
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      isEqual(obj[key], value)
    ) {
      matches.push({ object: obj, path: path });
    }

    // Traverse child objects
    Object.keys(obj).forEach((k) => {
      if (typeof obj[k] === "object" && obj[k] !== null) {
        traverse(obj[k], `${path}.${k}`);
      } else if (Array.isArray(obj[k])) {
        obj[k].forEach((item, index) => {
          traverse(item, `${path}.${k}[${index}]`);
        });
      }
    });
  }

  // Helper function for deep equality check
  function isEqual(a, b) {
    // Handle primitive types
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }

    // Handle objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  // Start traversing from the root object
  traverse(json, "$");

  return matches;
}

function* stepGen(steps) {
  while (true) yield* steps;
}

function onMount(cb) {
  throw new Error("onMount is deprecated, use createEffect instead");

  // log(counter, cb);
  if (altFuncCache[currComp]?.mount) return;
  // currMount = cb;
  mountFns.push(cb);
  // if (!funcCache[currComp]) mountFns.push(cb);
  // currMount = null;
}

function onCleanup(cb) {
  // log(callStack[counter]);
  currUnmount = cb;
}

function CompoIterator() {
  let temp = [];
  let s = null;

  function iterate(o) {
    if (o?.$c) {
      temp.push(o.$c);
      if (o?.children) {
        o.children.forEach((_o) => {
          iterate(_o);
        });
      }
      // log(o.$c);

      // log(temp);
      return [...temp];
    } else if (o?.children) {
      o.children.forEach((_o) => {
        iterate(_o);
      });
    }
  }

  function get(o, name, par) {
    if (o?.$c) {
      // temp.push(o.$c);
      if (o.$c === name && o.$p === par) {
        s = o;
      }
      if (o?.children && !s) {
        o.children.forEach((_o) => {
          get(_o, name, par);
        });
      }
      return s;
    } else if (o?.children) {
      o.children.forEach((_o) => {
        get(_o, name, par);
      });
    }
  }

  return {
    iterate: iterate,
    get,
  };
}

// export function Suspense(props, child) {
//   // if already in cache then return
//   const cached = suspenseCache[`${props?.cacheKey}`];
//   if (cached) {
//     if (cached.returnFn) {
//       cached.compo(child?.props);
//       return () => cached.returnFn(child?.props);
//     } else {
//       // return suspenseCache[`${props?.cacheKey}`](child?.props);
//       return cached.callbackFn(cached.returnVal);
//     }
//   }

//   // log(props);
//   let returnVal;
//   const [resolved, setResolved] = atom(false);

//   // log("promise NOT resolved");

//   if (props?.fetch?.then) {
//     // case 1. if fetch prop is provided (it can be any promise)
//     props.fetch.then((res) => {
//       // log("promise resolved", res);
//       // Suspense({ ...props, fetchCompleted: true }, res);
//       returnVal = res;
//       setResolved(true); // need so render is triggered
//     });
//   } else {
//     // case 2. if child is a promise module
//     child?.value
//       ?.then((res) => {
//         returnVal = res;
//         // update suspense cache
//         suspenseCache[`${props?.cacheKey}`] = res;

//         setResolved(true); // need so render is triggered
//       })
//       .catch((e) => {
//         // log(e);
//         setResolved(true); // need so render is triggered
//       });
//   }

//   return (props) => {
//     if (resolved()) {
//       if (props?.fetch?.then) {
//         // case when child is render props

//         suspenseCache[`${props?.cacheKey}`] = {
//           callbackFn: props.children[0],
//           returnVal,
//         };

//         return props.children[0](returnVal);
//       } else {
//         // case when child is normal component
//         if (returnVal) {
//           //cache the resolved compo

//           const returnFn = returnVal(props?.children?.[0]?.props || {});

//           suspenseCache[`${props?.cacheKey}`] = {
//             compo: returnVal, // this is compo
//             returnFn: returnFn,
//           };

//           log(suspenseCache[`${props?.cacheKey}`]);

//           return returnFn(props?.children?.[0]?.props || {});
//           // return h(returnVal({ ...props?.children?.[0]?.props }));
//         } else {
//           if (props?.errorFallback) return props?.errorFallback;
//           else return h("div", {}, [null]);
//         }
//       }
//     } else {
//       if (props?.fallback) {
//         // if (typeof props.fallback === "string") {
//         //   return h("div", {}, [props.fallback]);
//         //   // return {
//         //   //   type: "div",
//         //   //   children: [props.fallback],
//         //   // };
//         // } else {
//         //   return props.fallback;
//         // }
//         return h("div", {}, [props.fallback]);
//       } else return h("div", {}, [null]);
//       // return props?.fallback;
//     }
//   };
// }

// taken from: https://gist.github.com/umidjons/6865350

function walkDom(start_element) {
  let arr = []; // we can gather elements here
  let loop = function (element) {
    do {
      // we can do something with element
      if (element.nodeType == 1)
        // do not include text nodes
        arr.push(element);
      if (element.hasChildNodes()) loop(element.firstChild);
    } while ((element = element.nextSibling));
  };
  //loop(start_element);
  arr.push(start_element);
  loop(start_element.firstChild); // do not include siblings of start element
  return arr;
}

///////////////
// possible alternate 2 for walkDom
// actually this doesn't work correctly further investigation reqd

function* lazyDOMIterator(root, skip) {
  let current = root;
  while (current) {
    yield current;
    if (!skip(current) && current.children.length > 0) {
      yield* lazyDOMIterator(current.children[0], skip);
    }
    current = current.nextElementSibling;
  }
}

///////////////
// possible alternate 3 (complex) for walkDom

// https://blog.ag-grid.com/inside-fiber-an-in-depth-overview-of-the-new-reconciliation-algorithm-in-react/#general-algorithm
// below code modified for dom iteration by me

let startNode;
let nextUnitOfWork;

// how to use / call
// setTimeout(() => {
//   startNode = nextUnitOfWork = $d.querySelector("#root-vdom");
//   log(performance.now());
//   workLoop();
//   log(performance.now());
// }, 1000);

function workLoop() {
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function performUnitOfWork(workInProgress) {
  let next = beginWork(workInProgress);
  if (next === null) {
    next = completeUnitOfWork(workInProgress);
  }
  return next;
}

function beginWork(workInProgress) {
  // log("work performed for ", workInProgress);
  // return workInProgress.child;
  return workInProgress.firstElementChild;
}

function completeUnitOfWork(workInProgress) {
  while (true) {
    // let returnFiber = workInProgress.return;
    // let siblingFiber = workInProgress.sibling;
    let siblingFiber = workInProgress.nextElementSibling;
    let returnFiber = workInProgress.parentElement;

    nextUnitOfWork = completeWork(workInProgress);

    if (siblingFiber !== null) {
      // If there is a sibling, return it
      // to perform work for this sibling

      // if we started here
      if (workInProgress === startNode) {
        // log("sibling block");
        return null;
      }

      return siblingFiber;
    } else if (returnFiber !== null) {
      // If there's no more work in this returnFiber,
      // continue the loop to complete the returnFiber.
      workInProgress = returnFiber;

      continue;
    } else {
      // We've reached the root.

      return null;
    }
  }
}

function completeWork(workInProgress) {
  // log("work completed for ", workInProgress);
  return null;
}
