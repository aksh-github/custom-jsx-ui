import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // console.log(env);
  // target api url should be github (for local) or whatever server is used

  return {
    resolve: {
      alias: {
        // "@vdom-lib": "/src/lib/vdom-lib.js",
        // "@simple-state": "/src/lib/simple-state.js",
        "@vdom-lib": "/src/utils/vdom/vdom-lib.js",
        "@router-v2": "/src/utils/router-v2.jsx",
      },
    },
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "df",
      // jsxFactory: "domv2",
      // jsxFragment: "domv2",
      // jsxFactory: "MyUILib.createDomElement",
      // jsxFragment: "MyUILib.createFragement",
    },
    server: {
      proxy: {
        [`${env.VITE_BASEPATH}${env.VITE_TS}`]: {
          target: `${env.VITE_API_HOST}`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // console.log(path);
            return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_TS}/, "");
            // return path;
          },
          //   configure: (proxy, _options) => {
          //     proxy.on("error", (err, _req, _res) => {
          //       console.log("proxy error", err);
          //     });
          //     proxy.on("proxyReq", (proxyReq, req, _res) => {
          //       console.log(
          //         "Sending Request to the Target:",
          //         req.method,
          //         req.url,
          //         proxyReq
          //       );
          //     });
          //     proxy.on("proxyRes", (proxyRes, req, _res) => {
          //       console.log(
          //         "Received Response from the Target:",
          //         proxyRes.statusCode,
          //         req.url
          //       );
          //     });
          //   },
        },
        "/api/data": {
          target:
            // "${env.VITE_API_URL}data-ts.json",
            `${env.VITE_API_URL}`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // console.log(path);
            // const urlparts = path.split("/");
            // console.log(urlparts);
            return path.replace(/^\/api\/data/, "");
          },
        },
        [`${env.VITE_BASEPATH}${env.VITE_WORDS}`]: {
          target: `${env.VITE_API_HOST}`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // console.log(path);
            return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_WORDS}/, "");
            // return path;
          },
        },
        [`${env.VITE_BASEPATH}${env.VITE_VERBS}`]: {
          target: `${env.VITE_API_HOST}`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // console.log(path);
            return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_VERBS}/, "");
            // return path;
          },
        },
      },
    },
  };
});
