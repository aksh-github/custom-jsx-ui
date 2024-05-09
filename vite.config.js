import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "dom",
    jsxFragment: "dom",
  },
});
