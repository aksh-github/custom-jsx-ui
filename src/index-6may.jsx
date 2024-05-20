import { App, SimpleRoute } from "./App";
import { renderUtils, dom } from "./utils/lib.v2";
// import { renderUtils, dom } from "lib-jsx";
import router from "./utils/router";
import { registerRenderCallback } from "./utils/signal-complex";
import state from "./utils/simple-state";
import router2 from "./utils/router-v2";
import Login from "./chat/Login";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// renderUtils.render(root, () => () => <App some="akshay" />);

// for signal
registerRenderCallback(renderUtils.forceUpdate);

// for my state
const tempSt = state();
tempSt.registerRenderCallback(renderUtils.forceUpdate);

// checkout new simple: https://github.com/krasimir/navigo
console.log(
  "Interesting ***; https://github.com/Matt-Esch/virtual-dom https://github.com/snabbdom/snabbdom"
);

router2(
  {
    // errorComponent: Error,
    // basePath: "sommore",
    routes: [
      {
        path: "/route2",
        component: SimpleRoute,
      },
      // {
      //   path: "/",
      //   component: Login,
      // },
      { path: "/", component: App },
      { path: "*", component: () => () => <div>Error</div> },
    ],
  },
  (Compo, match) => {
    console.log(match);
    renderUtils.render(root, () => () => <Compo />);
  }
);

// navigo router
// https://github.com/krasimir/navigo/blob/master/DOCUMENTATION.md
// sample code

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
