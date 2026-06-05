import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@vdom-lib": "/src/utils/vdom/vdom-lib.js",
      "@dom-lib": "/src/utils/dom/dom-lib.js",
      "@simple-signal": "/src/utils/signal-v2.js",
    },
  },
  build: {
    lib: {
      entry: "./src/utils/dom/dom-lib.js", // or vdom-ai.js if that's your main file
      name: "Microframe",
      fileName: (format) => `microframe.${format}.[hash:8].js`,
      formats: ["es", "umd"],
    },
    outDir: "dist-lib",
    minify: true,
  },
});
