import http from "node:http";

const CHAT_POST_PORT = Number(process.env.CHAT_POST_PORT || 8787);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

let hasStarted = false;

export function startChatServer({ addMessage, onMessage } = {}) {
  if (hasStarted) {
    return;
  }

  if (typeof addMessage !== "function") {
    throw new Error("startChatServer requires an addMessage function");
  }

  hasStarted = true;

  const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method !== "POST" || req.url !== "/messages") {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 64 * 1024) {
        req.destroy();
      }
    });

    req.on("end", () => {
      let payload;

      try {
        payload = JSON.parse(body || "{}");
      } catch {
        sendJson(res, 400, { ok: false, error: "Invalid JSON" });
        return;
      }

      try {
        const message = addMessage(payload);
        onMessage?.(message);
        sendJson(res, 201, { ok: true, message });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: error instanceof Error ? error.message : "Invalid payload",
        });
      }
    });

    req.on("error", () => {
      sendJson(res, 400, { ok: false, error: "Bad request" });
    });
  });

  server.listen(CHAT_POST_PORT, () => {
    console.log(
      `Chat POST server listening on http://localhost:${CHAT_POST_PORT}`,
    );
  });
}
