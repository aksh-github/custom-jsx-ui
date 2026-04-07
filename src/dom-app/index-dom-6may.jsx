import { SsrApp } from "./App";
import { h, render } from "@dom-lib";

// this is perfect implementation as of 7-may-2024

// for UI
const root = document.getElementById("root");
// for non router
// renderUtils.render(root, () => () => <App />);

render(<SsrApp />, root);
