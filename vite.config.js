import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // console.log(env);
  // target api url should be github (for local) or whatever server is used

  return {
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "df",
      // jsxFactory: "domv2",
      // jsxFragment: "domv2",
    },
    server: {
      proxy: {
        "/api/data-ts": {
          target: `${env.VITE_API_URL}data-ts.json`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/data-ts/, ""),
        },
        "/api/data": {
          target:
            // "${env.VITE_API_URL}data-ts.json",
            `${env.VITE_API_URL}`,
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
  };
});
