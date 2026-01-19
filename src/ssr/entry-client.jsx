import { h, forceUpdate, hydrate, smartRegisterCallback } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";

// mount(document.getElementById("root"), () => <App />);

smartRegisterCallback(forceUpdate);

// forceUpdate(() => <App />);
hydrate(document.getElementById("root"), () => (
  // IMP: NEED TO BE SAME AS entry-server.jsx except for url
  // <SsrApp currentUrl={window.location.pathname} />
  <App type="built-in" url={window.location.pathname} />
));
