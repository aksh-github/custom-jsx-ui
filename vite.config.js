import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "df",
    // jsxFactory: "domv2",
    // jsxFragment: "domv2",
  },
  server: {
    proxy: {
      "/api/tsdata": {
        target:
          "https://raw.githubusercontent.com/aksh-github/pages/refs/heads/content/data/sanskrit/db/data-ts.json",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/tsdata/, ""),
      },
    },
  },
});
