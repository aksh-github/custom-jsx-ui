import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
// const cors = require("cors");

console.warn("Before running this ensure that you have already");
console.log("*************");
console.log(
  " change index.html include client-entry.jsx and comment any other index.js etc files",
);
console.log("In vite.config.js, enable SSR specific config");
console.log(" npm run build:all ");
console.log("*************");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extraPath = "..";
const serverPort = 5173;

const paths = {
  projectRoot: path.resolve(__dirname, extraPath),
  prodClientAssets: path.resolve(
    __dirname,
    extraPath,
    "dist-ssr/client/assets",
  ),
  prodTemplate: path.resolve(
    __dirname,
    extraPath,
    "dist-ssr/client/index.html",
  ),
  prodServerEntry: path.resolve(
    __dirname,
    extraPath,
    "dist-ssr/server/entry-server.js",
  ),
  prodSSRRender: path.resolve(
    __dirname,
    extraPath,
    "dist-ssr/server/vdom-ssr.js",
  ),
};

// Check for --prod or --production flag in command line arguments
const isProd = process.argv.includes("--prod");

console.log(`Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
// console.log(`Args:`, process.argv);

function shouldIgnoreRequest(url) {
  // Ignore browser diagnostic/static requests that don't need SSR.
  return (
    url.includes("/.well-known/") ||
    url.includes("/favicon.ico") ||
    url.includes("/vite.svg")
  );
}

function toSafeJson(data) {
  return (
    JSON.stringify(data)
      // Prevents closing-script injection in inline script tags.
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      // Prevents JS parsing issues for line/paragraph separators.
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029")
  );
}

function injectTemplate(template, { headerContent, bodyHtml, initData }) {
  return template
    .replace(`<!--ssr-outlet-->`, bodyHtml)
    .replace(`<!--ssr-header-->`, headerContent)
    .replace(
      `<!--INITIAL_DATA-->`,
      `window.__INITIAL_DATA__ = ${toSafeJson(initData)}`,
    );
}

async function loadSsrModules(vite) {
  if (isProd) {
    const renderModule = await import(
      pathToFileURL(paths.prodServerEntry).href
    );
    const ssrRenderModule = await import(
      pathToFileURL(paths.prodSSRRender).href
    );
    return { renderModule, ssrRenderModule };
  }

  const [renderModule, ssrRenderModule] = await Promise.all([
    vite.ssrLoadModule("/src/ssr/entry-server.jsx"),
    vite.ssrLoadModule("/src/utils/vdom/vdom-ssr.js"),
  ]);

  return { renderModule, ssrRenderModule };
}

async function resolveTemplate({ url, vite }) {
  if (isProd) {
    // Production: use prebuilt template from SSR output.
    return fs.readFileSync(paths.prodTemplate, "utf-8");
  }

  // Development: transform template through Vite for HMR and injected scripts.
  const template = fs.readFileSync(
    path.resolve(paths.projectRoot, "index.html"),
    "utf-8",
  );
  return vite.transformIndexHtml(url, template);
}

async function createServer() {
  const app = express();
  // app.use(cors()); // Allow your app to connect
  let vite;

  if (isProd) {
    const compression = (await import("compression")).default;

    console.log("compress used");

    app.use(compression());
    app.use("/assets", express.static(paths.prodClientAssets));
  } else {
    // Development: use Vite middleware
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);
  }

  const { renderModule, ssrRenderModule } = await loadSsrModules(vite);

  app.use("/", async (req, res, next) => {
    const url = req.originalUrl;

    if (shouldIgnoreRequest(url)) {
      return res.status(204).end();
    }

    console.log("Handling request for:", url);

    try {
      const template = await resolveTemplate({ url, vite });
      const { header, app, initialData } = await renderModule.render(url);

      const headerContent = header;
      const vdom = app();
      const bodyHtml = ssrRenderModule.renderToString(vdom);
      const initData = initialData || null;

      const html = injectTemplate(template, {
        headerContent,
        bodyHtml,
        initData,
      });

      const dispose = renderModule.dispose;
      if (dispose) {
        console.log("Reset state available");
        dispose();
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (!isProd && vite) vite.ssrFixStacktrace(e);
      console.error(e.stack);
      next(e);
    }
  });

  app.listen(serverPort, () => {
    console.log(
      `Server running at http://localhost:${serverPort} (${
        isProd ? "production" : "development"
      })`,
    );
  });
}

createServer();

// app.get("/api/stream", async (req, res, next) => {
//   // 1. Set required headers for SSE
//   res.setHeader("Content-Type", "application/json");
//   res.setHeader("Transfer-Encoding", "chunked");

//   const text =
//     "Hello! This is a real-time streaming response from your Express server.";
//   const words = text.split(" ");

//   let count = 0;

//   const intervalId = setInterval(() => {
//     if (count < words.length) {
//       // Build a structured JSON chunk
//       const chunk = {
//         id: count,
//         meta: `Token-${count}`,
//         word: `${words[count]}`,
//       };

//       // Write JSON string followed by a clear delimiter (like newline)
//       res.write(JSON.stringify(chunk) + "\n");
//       count++;
//     } else {
//       clearInterval(intervalId);
//       res.end(); // Terminate the stream pipeline cleanly
//     }
//   }, 400);

//   // 3. Clean up if user closes the tab
//   req.on("close", () => {
//     clearInterval(intervalId);
//     res.end();
//   });
// });
