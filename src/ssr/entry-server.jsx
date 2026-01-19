// import { renderToString } from "react-dom/server";

import { renderToString, h, reset } from "@vdom-lib";
import { SsrApp } from "./SsrApp";

export async function render(url) {
  console.log("Rendering for URL:", url);

  // this can be dynamically created based on url
  const header = `
  <!-- any JS or CSS can go here -->
  <meta property="og:title" content="संस्कृतकोष:">
<meta property="og:description" content="Sanskrit Dictionary App">
  `;

  const html = renderToString(
    // <StaticRouter location={url}>
    // <App />
    // </StaticRouter>
    <SsrApp currentUrl={url} />,
  );

  return { header, html };
}

// this is very important

export { reset };
