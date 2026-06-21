// import { renderToString } from "react-dom/server";

import { h, reset } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";
import { setSSRUrl } from "@router-v2";
import { renderToString } from "@vdom-ssr";
// import { Sans } from "../vdom-app/sans/sans";
import { Albums } from "../compos/ResourceTest";
import { Page } from "./Page1";

const getData = async (url) => {
  let result, err;

  try {
    result = await fetch(url);
    if (result?.ok) result = await result.json();
  } catch (e) {
    // console.log(e);
    err = e;
  }

  return {
    result,
    err,
  };
};

export async function render(url) {
  console.log("Rendering for URL:", url);

  // VV IMP step
  setSSRUrl(url);

  // this can be dynamically created based on url
  const header = `
  <!-- any JS or CSS can go here -->
  <meta property="og:title" content="संस्कृतकोष:">
<meta property="og:description" content="Sanskrit Dictionary App${Date.now()}">
  `;

  const { result, err } = await getData("http://localhost:8080"); //"http://localhost:3000/api/1"
  // console.log("Data fetched for SSR:", { result, err });

  const html = renderToString(
    // IMP: NEED TO BE SAME AS entry-server.jsx except for url
    // <SsrApp currentUrl={url} />,
    // <App type="dyn" url={url} />,
    <Page data={result} />,
  );
  // console.log(result);
  return { header, html, initialData: result };
}

export const dispose = () => {
  console.log("dispose called");
  reset();
};

// this is very important
