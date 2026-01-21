// import { renderToString } from "react-dom/server";

import { renderToString, h, reset } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";
import { setSSRUrl } from "@router-v2";

export const loader = async (url) => {
  // any init code put here

  setSSRUrl(url);

  console.log("loader called");
  return await fetch("http://localhost:3000/api/1");
};

export async function render(url, result, err) {
  console.log("Rendering for URL:", url, result, err);

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

export const dispose = () => {
  console.log("dispose called");
  reset();
};

// this is very important
