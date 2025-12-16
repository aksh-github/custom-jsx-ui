import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@vdom-lib"],
      output: {
        globals: {
          "@vdom-lib": "_vdomLib",
        },
      },
    },
    lib: {
      entry: "./src/utils/router-v2", // or vdom-ai.js if that's your main file
      name: "Microframe Router",
      fileName: (format) => `microframe-router.${format}.[hash:8].js`,
      formats: ["es", "umd"],
    },
    outDir: "dist-router-lib",
    minify: true,
  },
});
