import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "df",
    // jsxFactory: "domv2",
    // jsxFragment: "domv2",
  },
});
