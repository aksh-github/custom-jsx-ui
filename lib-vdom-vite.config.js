import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      // "@vdom-lib": "/src/utils/vdom/vdom-lib.js",
      "@vdom-lib": "/src/utils/vdom/vdom-key-lib-goog.js",
      // "@simple-state": "/src/lib/simple-state.js",
      "@vdom-ssr": "/src/utils/vdom/vdom-ssr.js",
      "@router-v2": "/src/utils/router-v2.jsx",
    },
  },
  build: {
    lib: {
      // entry: "./src/utils/vdom/vdom-lib.js", // or vdom-ai.js if that's your main file
      entry: "./src/utils/vdom/vdom-key-lib-goog.js",
      name: "Microframe",
      fileName: (format) => `microframe.${format}.goog.[hash:8].js`,
      formats: ["es", "umd"],
    },
    outDir: "dist-lib",
    minify: true,
  },
});
