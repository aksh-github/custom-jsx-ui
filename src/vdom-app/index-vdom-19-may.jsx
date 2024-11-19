import { App, SimpleRoute, TextArea } from "./App";
import { registerRenderCallback } from "../utils/signal-complex";
import { registerCallback } from "../utils/simple-state";
import { h, mount, forceUpdate, onMount } from "../utils/vdom/vdom-lib";
import { SimpleSwitch } from "../compos/Switch";
import { navigoRouter } from "../utils/navigo-router";
import { registerRenderCallbackV2 } from "../utils/signal-v2";
import { ArrayWithFragments } from "../compos/ComponentPatterns";

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
registerCallback(forceUpdate);

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

// mount(root, () => <App />);

mount(root, () => <Captcha />);

export function generateCaptcha() {
  let uniquechar = "";

  const randomchar =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Generate captcha for length of 5 with random character
  for (let i = 1; i < 6; i++) {
    uniquechar += randomchar.charAt(Math.random() * randomchar.length);
  }

  return uniquechar;
}

function Captcha() {
  onMount(() => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");

    // Set font properties
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Write sample text
    const captchaText = generateCaptcha();
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);

    // Strike through the text
    ctx.strokeStyle = "red"; // Color of the strike-through line
    ctx.lineWidth = 2; // Thickness of the strike-through line
    ctx.lineCap = "round"; // Rounded ends for the line

    const strikeThroughX = canvas.width / 2;
    const strikeThroughY = canvas.height / 2;
    const strikeThroughLength = captchaText.length * 20; // Adjust based on font size

    ctx.beginPath();
    ctx.moveTo(strikeThroughX - strikeThroughLength / 2, strikeThroughY);
    ctx.lineTo(strikeThroughX + strikeThroughLength / 2, strikeThroughY);
    ctx.stroke();
  });

  return () => <canvas id="myCanvas" width="100" height="50"></canvas>;
}
