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
      "/api/data-ts": {
        target:
          "https://raw.githubusercontent.com/aksh-github/pages/refs/heads/content/data/sanskrit/db/data-ts.json",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/data-ts/, ""),
      },
      "/api/data": {
        target:
          // "https://raw.githubusercontent.com/aksh-github/pages/refs/heads/content/data/sanskrit/db/data-ts.json",
          "https://raw.githubusercontent.com/aksh-github/pages/refs/heads/content/data/sanskrit/db/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(path);
          // const urlparts = path.split("/");
          // console.log(urlparts);
          return path.replace(/^\/api\/data/, "");
        },
      },
    },
  },
});
