import { h, hydrate } from "@vdom-lib";
import { SsrApp } from "../compos/SsrApp";
import { App } from "../vdom-app/App";
// import { Sans } from "../vdom-app/sans/sans";
import { ResourceTest } from "../compos/ResourceTest";
import { Stream } from "../compos/Stream";
import { ServerData } from "../compos/ServerData";

// mount(document.getElementById("root"), () => <App />);

// moved to vdom-lib
// smartRegisterCallback(forceUpdate);

// forceUpdate(() => <App />);
hydrate(document.getElementById("root"), () => (
  // IMP: NEED TO BE SAME AS entry-server.jsx except for url
  // <SsrApp currentUrl={window.location.pathname} />
  // <App type="dyn" url={window.location.pathname} />
  // <Stream />
  // <ResourceTest />
  <ServerData data={window.__INITIAL_DATA__} />
));
