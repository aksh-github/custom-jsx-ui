import { h, forceUpdate, hydrate } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";

// mount(document.getElementById("root"), () => <App />);

// moved to vdom-lib
// smartRegisterCallback(forceUpdate);

// forceUpdate(() => <App />);
hydrate(document.getElementById("root"), () => (
  // IMP: NEED TO BE SAME AS entry-server.jsx except for url
  // <SsrApp currentUrl={window.location.pathname} />
  <App type="dyn" url={window.location.pathname} />
));
