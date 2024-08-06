import { App, SimpleRoute } from "./App";
import { registerRenderCallback } from "../utils/signal-complex";
import state from "../utils/simple-state";
import {
  updateElement,
  h,
  mount,
  forceUpdate,
  onMount,
} from "../utils/vdom/vdom-lib";
import { SimpleSwitch } from "../compos/Switch";
import { navigoRouter } from "../utils/navigo-router";
import { registerRenderCallbackV2 } from "../utils/signal-v2";

// v basic test 23may
// let count = 0;

// const log = () => {};

// const Somec = (props) => {
//   console.log(props);
//   return () => {
//     return (
//       <div>
//         akshay{props.hello}
//         <input />
//       </div>
//     );
//   };
// };

// const Comp = () => {
//   console.log("exeted");

//   return () => (
//     <div>
//       <ul style="list-style: none;">
//         <li className="item" onClick={() => alert("hi!")}>
//           item {String(count)}
//         </li>
//         <li className="item">
//           <input
//             type="checkbox"
//             checked={true}
//             onChange={(e) => console.log(e)}
//           />
//           <input type="text" onInput={log} />
//         </li>

//         <li forceUpdate={false}>text</li>
//       </ul>
//       <Somec hello="world is beautiful" />
//     </div>
//   );
// };

// const $root = document.getElementById("root");

// const Odd =
//   () =>
//   ({ v }) =>
//     v + "odd22";

// const Even =
//   () =>
//   ({ v }) =>
//     v + "even";

// const Tp = () => {
//   return () => (
//     <div>
//       <Even v="this is " />
//       <div>sim div</div>
//       <Odd v="this is " />
//     </div>
//   );
// };

// mount($root, () => <Tp />);

// const __t = setInterval(() => {
//   count++;

//   if (count > 2) clearInterval(__t);

//   forceUpdate();
// }, 2000);
// end v basic test 23may

// =======================

// fresh extensive test

const root = document.getElementById("root-vdom");
// for non router
// mount(root, () => <App some={2} />);

// for signal
registerRenderCallback(forceUpdate);

// for signal v2
registerRenderCallbackV2(forceUpdate);

// for my state
const tempSt = state();
tempSt.registerRenderCallback(forceUpdate);

// mount(root, () => <App />);

// router with switch try

// const A = () => "Route A";
// const B = () => "Route B";

// const Index = () => {
//   const rs = state({ path: "" });

//   const setupRoute = () =>
//     navigoRouter.set(
//       {
//         // errorComponent: Error,
//         // basePath: window.location.pathname,
//         routes: [
//           {
//             path: "/chat",
//             // component: A,
//           },
//           {
//             path: "/",
//             // component: B,
//           },
//           {
//             path: "*",
//             // component: () => <div>Wrong url</div>,
//           },
//         ],
//       },
//       (Compo, match) => {
//         console.log(Compo, match);
//         rs.set({ path: match?.url });
//       }
//     );

//   onMount(() => {
//     console.log("index mounted");
//     setupRoute();
//   });
//   return () => (
//     <SimpleSwitch cond={rs.get("path")}>
//       <SimpleSwitch.Case when={"chat"} render={<A />} />
//       <SimpleSwitch.Case when={""} render={<B />} />
//       <SimpleSwitch.Case render={"Loadin.."} />
//     </SimpleSwitch>
//   );
// };

mount(root, () => <App />);
