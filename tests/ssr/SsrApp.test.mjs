import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

const originalFetch = globalThis.fetch;
const fetchCalls = [];

globalThis.fetch = async (url) => {
  fetchCalls.push(String(url));
  return {
    ok: true,
    async json() {
      return { ok: true, url: String(url) };
    },
  };
};

const server = await createServer({
  configFile: false,
  root: projectRoot,
  appType: "custom",
  logLevel: "error",
  resolve: {
    alias: {
      "@vdom-lib": path.join(projectRoot, "src/utils/vdom/vdom-lib.js"),
      "@vdom-ssr": path.join(projectRoot, "src/utils/vdom/vdom-ssr.js"),
      "@router-v2": path.join(projectRoot, "src/utils/router-v2.jsx"),
    },
  },
  esbuild: {
    jsxFactory: "h",
    jsxFragment: "df",
  },
  server: {
    middlewareMode: true,
    hmr: false,
  },
});

try {
  const { h } = await server.ssrLoadModule("/src/utils/vdom/vdom-lib.js");
  const { renderToString } = await server.ssrLoadModule(
    "/src/utils/vdom/vdom-ssr.js",
  );
  const { SsrApp } = await server.ssrLoadModule("/src/ssr/SsrApp.jsx");

  const html = renderToString(h(SsrApp, { currentUrl: "/ssr?from=test#hash" }));

  assert.ok(html.includes("<h2>SSR App"));
  assert.ok(html.includes("Counter: <!--|-->0<!--|-->"));
  assert.ok(html.includes('class="some-class"'));
  assert.ok(html.includes('style="background-color:lightblue;padding:10px"'));
  assert.ok(html.includes('<script id="dyn-script"></script>'));
  assert.ok(!html.includes('href="javascript:alert(10)"'));
  assert.ok(!html.includes("this should be ignored"));
  assert.ok(!html.includes("this is the default case"));
  assert.ok(html.includes("this is 10"));
  assert.ok(html.includes("this is even"));
  assert.ok(html.includes("Loading TextArea..."));
  assert.ok(html.includes("<!--null--><!--undefined--><!--true--><!--false-->"));

  assert.ok(
    fetchCalls.includes("http://localhost:3000/api/1"),
    "expected the module-level fetch to be stubbed and invoked",
  );

  console.log("SsrApp SSR unit test passed");
} finally {
  await server.close();
  globalThis.fetch = originalFetch;
}
