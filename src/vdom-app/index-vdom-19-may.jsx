import { App } from "./App";
import { registerRenderCallback } from "../utils/signal-complex";
import state from "../utils/simple-state";
import { updateElement, h, mount, forceUpdate } from "../utils/vdom/vdom-lib";

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

const $root = document.getElementById("root-vdom");
mount($root, () => <App some={2} />);

// for signal
registerRenderCallback(forceUpdate);

// for my state
const tempSt = state();
tempSt.registerRenderCallback(forceUpdate);
