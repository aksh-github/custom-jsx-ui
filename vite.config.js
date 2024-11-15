import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "domv2",
    jsxFragment: "domv2",
  },
});
