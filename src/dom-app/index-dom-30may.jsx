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
import { Sans } from "./sans/sans";

document.getElementById("root").appendChild(createElement(<Sans />));
