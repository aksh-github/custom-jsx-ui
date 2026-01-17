import { h, forceUpdate, hydrate, smartRegisterCallback } from "@vdom-lib";
import { SsrApp } from "./SsrApp";

// mount(document.getElementById("root"), () => <App />);

smartRegisterCallback(forceUpdate);

// forceUpdate(() => <App />);
hydrate(document.getElementById("root"), () => (
  <SsrApp currentUrl={window.location.pathname} />
));
