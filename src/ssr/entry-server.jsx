// import { renderToString } from "react-dom/server";

import { renderToString, h, reset } from "@vdom-lib";
import { SsrApp } from "./SsrApp";
import { App } from "../vdom-app/App";
import { setSSRUrl } from "@router-v2";

const getData = async (url) => {
  let result, err;

  try {
    result = await fetch(url);
    if (result?.ok && result.json) result = await result.json();
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

  // const { result, err } = await getData("http://localhost:3000/api/1");

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
