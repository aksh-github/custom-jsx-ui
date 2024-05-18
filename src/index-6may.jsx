import { App, SimpleRoute } from "./App";
import { renderUtils, dom } from "./utils/lib.v2";
// import { renderUtils, dom } from "lib-jsx";
import router from "./utils/router";
import { registerRenderCallback } from "./utils/signal-complex";
import state from "./utils/simple-state";
import router2 from "./utils/router-v2";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// renderUtils.render(root, renderUtils.h(<App some="akshay" />));

// for signal
registerRenderCallback(renderUtils.forceUpdate);

// for my state
const tempSt = state();
tempSt.registerRenderCallback(renderUtils.forceUpdate);

// checkout new simple: https://github.com/krasimir/navigo
console.log("ROUTING ***; https://github.com/krasimir/navigo");

router2(
  {
    // errorComponent: Error,
    // basePath: "sommore",
    routes: [
      {
        path: "/route2",
        component: SimpleRoute,
      },
      { path: "/", component: App },
      { path: "*", component: () => () => <div>Error</div> },
    ],
  },
  (Compo, match) => {
    console.log(match);
    renderUtils.render(root, renderUtils.h(<Compo />));
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

// good: https://www.youtube.com/watch?v=FITxnIDsMnw
