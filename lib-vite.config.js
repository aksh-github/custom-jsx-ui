import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/utils/vdom/vdom-lib.js", // or vdom-ai.js if that's your main file
      name: "Microframe",
      fileName: (format) => `microframe.${format}.${Date.now()}.js`,
      formats: ["es", "umd"],
    },
    outDir: "dist-lib",
    minify: true,
  },
});
