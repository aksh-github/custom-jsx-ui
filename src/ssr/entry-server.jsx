// import { renderToString } from "react-dom/server";

import { renderToString, h, reset } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";
import { setSSRUrl } from "../utils/router-v2";

export async function render(url) {
  console.log("Rendering for URL:", url);

  // this can be dynamically created based on url
  const header = `
  <!-- any JS or CSS can go here -->
  <meta property="og:title" content="संस्कृतकोष:">
<meta property="og:description" content="Sanskrit Dictionary App">
  `;

  const html = renderToString(
    // IMP: NEED TO BE SAME AS entry-server.jsx except for url
    // <SsrApp currentUrl={url} />,
    // <App type="built-in" url={url} />,

    <App type="built-in" url={url} />,
  );

  return { header, html };
}

// this is very important

export { setSSRUrl, reset };
