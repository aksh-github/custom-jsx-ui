import { App, SimpleRoute } from "./App";
import { forceUpdate, render, dom, makeFC } from "./utils/lib.v2";
import router from "./utils/router";
import { registerRenderCallback } from "./utils/signal-complex";
import state from "./utils/simple-state";
import router2 from "./utils/router-v2";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// render(root, App);

// for signal
registerRenderCallback(forceUpdate);

// for my state
const tempSt = state();
tempSt.registerRenderCallback(forceUpdate);

// for multiple routes

// const routes = {
//   errorComponent: Error,
//   routes: [
//     { path: "/", component: App },
//     { path: "/route2", component: SimpleRoute },
//   ],
// };

// router(routes, (Compo) => {
//   // console.log(Compo);
//   render(root, Compo);
// });

// for multiple routes end

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
    render(root, Compo);
  }
);

// all documentation:
// https://github.com/krasimir/navigo/blob/master/DOCUMENTATION.md
// sample code

//   const router = new Navigo("/", { linksSelector: "a" });
//   const render = (content) =>
//     (document.querySelector("#content").innerHTML = content);

// router.on("/chat", (match) => {
//       console.log(match);
//       render("About");
//     }).on('/', (match) => {
//     console.log(match)
//   render("Home");
// }).notFound(() => {
//       render("Not found");
//     }).resolve();
