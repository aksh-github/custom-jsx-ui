import { defineConfig, loadEnv } from "vite";

const shared = {
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "df",
    // jsxInject: `import { h, df } from '/src/lib/vdom/vdom-lib.js'`,
  },
  alias: {
    // "@vdom-lib": "/src/lib/vdom-lib.js",
    // "@simple-state": "/src/lib/simple-state.js",
    "@vdom-lib": "/src/utils/vdom/vdom-lib.js",
    "@vdom-ssr": "/src/utils/vdom/vdom-ssr.js",
    "@router-v2": "/src/utils/router-v2.jsx",
  },
};

// 1. This is just for client

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd());

//   // console.log(env);
//   // target api url should be github (for local) or whatever server is used

//   return {
//     resolve: {
//       alias: {
//         ...shared.alias,
//       },
//     },
//     esbuild: {
//       ...shared.esbuild,
//       // jsxFactory: "domv2",
//       // jsxFragment: "domv2",
//       // jsxFactory: "MyUILib.createDomElement",
//       // jsxFragment: "MyUILib.createFragement",
//     },
//     server: {
//       proxy: {
//         [`${env.VITE_BASEPATH}${env.VITE_TS}`]: {
//           target: `${env.VITE_API_HOST}`,
//           changeOrigin: true,
//           secure: false,
//           rewrite: (path) => {
//             // console.log(path);
//             return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_TS}/, "");
//             // return path;
//           },
//           //   configure: (proxy, _options) => {
//           //     proxy.on("error", (err, _req, _res) => {
//           //       console.log("proxy error", err);
//           //     });
//           //     proxy.on("proxyReq", (proxyReq, req, _res) => {
//           //       console.log(
//           //         "Sending Request to the Target:",
//           //         req.method,
//           //         req.url,
//           //         proxyReq
//           //       );
//           //     });
//           //     proxy.on("proxyRes", (proxyRes, req, _res) => {
//           //       console.log(
//           //         "Received Response from the Target:",
//           //         proxyRes.statusCode,
//           //         req.url
//           //       );
//           //     });
//           //   },
//         },
//         "/api/data": {
//           target:
//             // "${env.VITE_API_URL}data-ts.json",
//             `${env.VITE_API_URL}`,
//           changeOrigin: true,
//           secure: false,
//           rewrite: (path) => {
//             // console.log(path);
//             // const urlparts = path.split("/");
//             // console.log(urlparts);
//             return path.replace(/^\/api\/data/, "");
//           },
//         },
//         [`${env.VITE_BASEPATH}${env.VITE_WORDS}`]: {
//           target: `${env.VITE_API_HOST}`,
//           changeOrigin: true,
//           secure: false,
//           rewrite: (path) => {
//             // console.log(path);
//             return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_WORDS}/, "");
//             // return path;
//           },
//         },
//         [`${env.VITE_BASEPATH}${env.VITE_VERBS}`]: {
//           target: `${env.VITE_API_HOST}`,
//           changeOrigin: true,
//           secure: false,
//           rewrite: (path) => {
//             // console.log(path);
//             return path.replace(/^\/${env.VITE_BASEPATH}${env.VITE_VERBS}/, "");
//             // return path;
//           },
//         },
//       },
//     },
//   };
// });

// 2. This is for SSR

export default defineConfig(({ command, mode, isSsrBuild }) => {
  if (isSsrBuild) {
    console.log("Building for SSR");
    // Server build
    return {
      resolve: {
        alias: {
          ...shared.alias,
        },
      },
      esbuild: {
        ...shared.esbuild,
      },
      build: {
        ssr: "./src/ssr/entry-server.jsx",
        outDir: "dist-ssr/server",
      },
    };
  }
  // Client build
  console.log("Building for Client");
  return {
    resolve: {
      alias: {
        ...shared.alias,
      },
    },
    esbuild: {
      ...shared.esbuild,
    },
    build: {
      outDir: "dist-ssr/client",
    },
  };
});
