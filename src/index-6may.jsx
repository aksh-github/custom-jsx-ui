import { App, SimpleRoute } from "./App";
import { forceUpdate, render } from "./utils/lib";
import router from "./utils/router";
import { registerRenderCallback } from "./utils/signal-complex";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// render(root, App);

// for signal
registerRenderCallback(forceUpdate);

// only for multiple routes

const routes = {
  errorComponent: Error,
  routes: [
    { path: "/", component: App },
    { path: "/route2", component: SimpleRoute },
  ],
};

router(routes, (Compo) => {
  // console.log(Compo);
  render(root, Compo);
});

// only for multiple routes end
