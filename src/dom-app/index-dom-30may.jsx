import {
  h,
  createElement,
  addPatches,
  addPropsPatches,
  signal,
  effect,
} from "@dom-lib";

import { App } from "./Simple";
import { PerfTest } from "./PerfTest";

document.getElementById("root").appendChild(createElement(<PerfTest />));
