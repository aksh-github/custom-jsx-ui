import { registerRenderCallback } from "../utils/signal-complex";
import state from "../utils/simple-state";
import { h, mount, forceUpdate } from "../utils/vdom/vdom-lib";
import NavigoRouter from "../utils/navigo-router";
import Login from "./Login";
import { appState } from "./state-helper";
import "./index.css";
import "./welcome.css";
import { ChatWindow } from "./ChatWindow";

const root = document.getElementById("root-vdom");
// for non router
// mount(root, () => <App some={2} />);

console.log(
  "interesting read: https://github.com/persevie/statemanjs?ref=hackernoon.com"
);

// for signal
registerRenderCallback(forceUpdate);

// for my state
appState.registerRenderCallback(forceUpdate);

NavigoRouter.set(
  {
    // errorComponent: Error,
    basePath: window.location.pathname,
    routes: [
      {
        path: "/",
        component: Login,
      },
      {
        path: "/chat",
        component: ChatWindow,
      },

      {
        path: "*",
        component: () => () => <div>Error occurred</div>,
      },
    ],
  },
  (Compo, match) => {
    console.log(match);
    //   renderUtils.render(root, () => <Compo />);
    mount(root, () => <Compo />);
  }
);
