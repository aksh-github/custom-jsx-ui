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

export const getTextAreaCompo = async (props) => {
  return await import("../compos/ComponentPatterns");
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

export const DynTextArea = (props) => (
  <Lazy
    fallback={<section>Loading TextArea...</section>}
    key="TextArea" // have diff props.key thru props in case you need to reload across route etc.
    error={
      <section>
        Test error scenario for TextArea: Component can't be loaded at this time
      </section>
    }
    promise={() => getTextAreaCompo()}
    render={({ result }) => {
      const Mod = result;
      return <Mod.TextArea {...props} />;
    }}
  />
);

export const DynCompo = () => (
  <Lazy
    promise={() => DynCompoPromise}
    key="PropsDriven"
    fallback={<div>Loading Props driven compo...</div>}
    // n="This is a props driven component"
    error={
      <section>
        Test error scenario for PropsDriven: Component can't be loaded at this
        time
      </section>
    }
    render={({ result: Mod }) => (
      <Mod.PropsDriven n="This is a props driven component" />
    )}
  />
);

export const DynArrayWithFragments = ({ t }) => (
  <Lazy
    promise={() => ArrayWithFragmentsPromise()}
    fallback={<div>Loading Array with Fragments...</div>}
    // some={t}
    key="awf"
    render={({ result: Mod }) => <Mod.ArrayWithFragments some={t} />}
  />
);

export const DynSans = () => (
  <Lazy
    promise={() => SansCompoPromise()}
    // resolve="Sans"
    fallback={<p>Loading Sanskrit...</p>}
    key={"Sans"}
    test={123}
    error={
      <div>
        <h1>Error</h1>
        <p>Something went wrong !!</p>
      </div>
    }
    render={({ result: Mod }) => <Mod.Sans />}
  />
);
