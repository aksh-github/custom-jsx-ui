//1. promises

import { h, Lazy } from "@vdom-lib";

let _i = 0,
  _ArrayWithFragments = null;
const ArrayWithFragmentsPromise = () => {
  // if cond is not reqd strictly
  if (_ArrayWithFragments) {
    return Promise.resolve(_ArrayWithFragments);
  }

  return import("../compos/ComponentPatterns").then((mod) => {
    _ArrayWithFragments = mod.ArrayWithFragments;
    // return ArrayWithFragments;
    return _ArrayWithFragments;
  });
  // .catch((e) => {
  //   console.log(e);
  // });
};

const photoURL = "https://picsum.photos/200"; // Gives pic of size 200x200
const getMyAwesomePic = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(photoURL), 500);
  });
};

const DynCompoPromise = () => {
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => resolve(10), 3000);
  // });
  return import("../compos/ComponentPatterns");
  // .then((mod) => mod?.PropsDriven);
};

const TextAreaComp = () => {
  return import("../compos/ComponentPatterns");
};

// const SansCompoPromise = () => {
//   // return new Promise((resolve, reject) => {
//   //   setTimeout(() => resolve(10), 3000);
//   // });
//   return import("../vdom-app/sans/sans");
//   // .then((mod) => mod?.Sans);
// };

const SansCompoPromise = async () => {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  return await import("../vdom-app/sans/sans");
};

// 2. Util functions to use above promises

export const DynTextArea = () => (
  <Lazy
    importFn={TextAreaComp}
    resolve="TextArea"
    fallback={<div>Loading TextArea...</div>}
    key="TextArea"
  />
);

export const DynCompo = () => (
  <Lazy
    importFn={DynCompoPromise}
    resolve="PropsDriven22"
    fallback={"<div>Loading Props Driven...</div>"}
    key="PropsDriven"
    n="This is a prop driven component"
    error={
      <section>
        Test error scenario for PropsDriven: Component can't be loaded at this
        time
      </section>
    }
    // fallback="Loading..."
    // errorFallback={<div>Something went wrong</div>}
  />
);

export const DynArrayWithFragments = ({ t }) => (
  <Lazy
    importFn={ArrayWithFragmentsPromise}
    resolve="ArrayWithFragments"
    fallback={<div>Loading Array with Fragments...</div>}
    some={t}
    key="awf"
  />
);

export const DynSans = () => (
  <Lazy
    importFn={SansCompoPromise}
    resolve="Sans"
    fallback={<p>Loading Sanskrit...</p>}
    key={"Sans"}
    test={123}
    error={
      <div>
        <h1>Error</h1>
        <p>Something went wrong !!</p>
      </div>
    }
  />
);
