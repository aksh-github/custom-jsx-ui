// import { renderToString } from "react-dom/server";

import { renderToString, h, reset } from "@vdom-lib";
import { SsrApp } from "./App";

export async function render(url) {
  console.log("Rendering for URL:", url);

  return renderToString(
    // <StaticRouter location={url}>
    // <App />
    // </StaticRouter>
    <SsrApp currentUrl={url} />
  );
}

// this is very important

export { reset };
