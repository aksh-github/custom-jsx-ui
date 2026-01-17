import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.argv.includes("--prod");

console.log(`Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCachedHtml(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.html;
  }
  return null;
}

function setCachedHtml(url, html) {
  cache.set(url, { html, timestamp: Date.now() });
}

async function createServer() {
  const app = express();
  let vite, renderModule, resetState, template;

  if (isProd) {
    app.use(
      "/assets",
      express.static(path.resolve(__dirname, "dist/client/assets"))
    );

    const serverPath = path.resolve(__dirname, "dist/server/entry-server.js");
    renderModule = await import(pathToFileURL(serverPath).href);

    const statePath = path.resolve(__dirname, "dist/server/entry-server.js");
    resetState = (await import(pathToFileURL(statePath).href)).reset;

    // Read template once at startup
    template = fs.readFileSync(
      path.resolve(__dirname, "dist/client/index.html"),
      "utf-8"
    );
  } else {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);
  }

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (url.includes("/.well-known/") || url.includes("/favicon.ico")) {
      return res.status(204).end();
    }

    console.log("Handling request for:", url);

    try {
      let html;

      if (isProd) {
        // Check cache first
        html = getCachedHtml(url);

        if (!html) {
          console.log("Cache MISS - generating HTML for:", url);
          const appContent = await renderModule.render(url);
          html = template.replace(`<!--ssr-outlet-->`, appContent);
          setCachedHtml(url, html);
          if (resetState) resetState();
        } else {
          console.log("Cache HIT for:", url);
        }
      } else {
        // Dev mode - no caching
        const devTemplate = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        const transformedTemplate = await vite.transformIndexHtml(
          url,
          devTemplate
        );

        renderModule = await vite.ssrLoadModule("/src/entry-server.jsx");
        const stateModule = await vite.ssrLoadModule(
          "/src/lib/simple-state.js"
        );
        resetState = stateModule.reset;

        const appContent = await renderModule.render(url);
        html = transformedTemplate.replace(`<!--ssr-outlet-->`, appContent);

        if (resetState) resetState();
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
