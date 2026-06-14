import {
  h,
  mount,
  createState,
  createEffect,
  // createContext,
  // memo,
  forceUpdate,
} from "@vdom-lib";

// import { RouterAdv, LinkV2, routerInstance, routerContext } from "@router-v2";

import { App } from "./App";
// import { PerfTest } from "../compos/PerfTest";
// import { SsrApp } from "../ssr/SsrApp";
import { Sans } from "./sans/sans";
// import { DragDrop } from "./dnd/DragDrop";
// import { ArrayWithFragments } from "../compos/ComponentPatterns";

// =======================

// fresh extensive test

// for my state
// registerCallback(forceUpdate);
// moved to vdom-lib
// smartRegisterCallback(forceUpdate, 50);

const root = document.getElementById("root");
mount(root, () => <App type="dyn" />);
// mount(root, () => <Sans />);
// mount(root, () => <SsrApp currentUrl={window.location.pathname} />);
// mount(root, () => (
//   <df>
//     <p>before</p>
//     <ArrayWithFragments />
//     <p>after</p>
//   </df>
// ));
// mount(root, () => <PerfTest />);
// mount(root, () => <Test />);

// Usage
