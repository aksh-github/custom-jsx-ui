import { App } from "./App";
import { renderUtils, dom } from "../utils/dom/lib.v2";
// import { renderUtils, dom } from "lib-jsx";
// import router from "../utils/router";
import { registerRenderCallback } from "../utils/signal-complex";
import { registerCallback } from "../utils/simple-state";
import { registerRenderCallbackV2 } from "../utils/signal-v2";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// for non router
// renderUtils.render(root, () => () => <App />);

// for signal
registerRenderCallback(renderUtils.forceUpdate);

// for signal v2
registerRenderCallbackV2(renderUtils.forceUpdate);

// for my state
registerCallback(renderUtils.forceUpdate);

// router moved to App

renderUtils.render(root, () => () => <App />);

console.log(
  "Interesting ***; https://github.com/Matt-Esch/virtual-dom https://github.com/snabbdom/snabbdom https://github.com/themarcba/vue-vdom https://www.youtube.com/watch?v=85gJMUEcnkc"
);

// npm local package
// https://www.youtube.com/watch?v=VuysNccCnEQ

// npm publish
// https://www.youtube.com/watch?v=S_wvHDOrac0
// https://www.youtube.com/watch?v=xnfdm-s8adI

// vite based npm link v good.
// https://www.youtube.com/watch?v=FITxnIDsMnw
// relative-deps better than npm link
// https://github.com/mweststrate/relative-deps
// https://blog.logrocket.com/relative-deps-alternative-npm-link-relative-dependencies/
