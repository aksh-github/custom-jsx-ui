import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";

console.warn("Before running this ensure that you have already");
console.log("*************");
console.log(
  " change index.html include client-entry.jsx and comment any other index.js etc files"
);
console.log("In vite.config.js, enable SSR specific config");
console.log(" npm run build:all ");
console.log("*************");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extraPath = "..";

// Check for --prod or --production flag in command line arguments
const isProd = process.argv.includes("--prod");

console.log(`Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
// console.log(`Args:`, process.argv);

async function createServer() {
  const app = express();
  let vite, renderModule, resetStateForServer;

  if (isProd) {
    // Production: serve pre-built assets
    app.use(
      "/assets",
      express.static(
        path.resolve(__dirname, extraPath, "dist-ssr/client/assets")
      )
    );

    // Load the built server module - FIX: Use pathToFileURL
    const serverPath = path.resolve(
      __dirname,
      extraPath,
      "dist-ssr/server/entry-server.js"
    );
    renderModule = await import(pathToFileURL(serverPath).href);
  } else {
    // Development: use Vite middleware
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);
  }

  app.use("/", async (req, res, next) => {
    const url = req.originalUrl;

    // Ignore browser diagnostic requests
    if (url.includes("/.well-known/") || url.includes("/favicon.ico")) {
      return res.status(204).end();
    }

    console.log("Handling request for:", url);

    try {
      let template, appContent;

      if (isProd) {
        // Read built template
        template = fs.readFileSync(
          path.resolve(__dirname, extraPath, "dist-ssr/client/index.html"),
          "utf-8"
        );
        const result = await renderModule.render(url);
        appContent = result;

        resetStateForServer = renderModule.reset;
      } else {
        // Dev mode with HMR
        template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);

        renderModule = await vite.ssrLoadModule("/src/ssr/entry-server.jsx");
        const stateModule = await vite.ssrLoadModule(
          "/src/utils/simple-state.js"
        );
        resetStateForServer = stateModule.reset;

        const result = await renderModule.render(url);
        appContent = result;
      }

      const html = template.replace(`<!--ssr-outlet-->`, appContent);

      if (resetStateForServer) {
        console.log("Reset state available");
        resetStateForServer();
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (!isProd && vite) vite.ssrFixStacktrace(e);
      console.error(e.stack);
      next(e);
    }
  });

  app.listen(5173, () => {
    console.log(
      `Server running at http://localhost:5173 (${
        isProd ? "production" : "development"
      })`
    );
  });
}

createServer();
