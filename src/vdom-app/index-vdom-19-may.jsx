import { App, SimpleRoute } from "./App";
import { registerRenderCallback } from "../utils/signal-complex";
import state from "../utils/simple-state";
import { updateElement, h, mount, forceUpdate } from "../utils/vdom/vdom-lib";
import NavigoRouter from "../utils/navigo-router";

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

// for my state
const tempSt = state();
tempSt.registerRenderCallback(forceUpdate);

NavigoRouter.set(
  {
    // errorComponent: Error,
    // basePath: "sommore",
    routes: [
      {
        path: "/",
        component: SimpleRoute,
      },
      // {
      //   path: "/",
      //   component: Chat,
      // },
      { path: "/route2", component: App },
      { path: "*", component: () => () => <div>Error</div> },
    ],
  },
  (Compo, match) => {
    console.log(match);
    //   renderUtils.render(root, () => <Compo />);
    mount(root, () => <Compo />);
  }
);
