import http from "node:http";

const CHAT_POST_PORT = Number(process.env.CHAT_POST_PORT || 8787);
const CHAT_CORS_ORIGIN =
  process.env.CHAT_CORS_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = CHAT_CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getAllowedOrigin(req) {
  const requestOrigin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes("*")) {
    return "*";
  }

  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return ALLOWED_ORIGINS[0] || "http://localhost:5173";
}

function setCorsHeaders(req, res) {
  const allowedOrigin = getAllowedOrigin(req);

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");
  res.setHeader("Vary", "Origin");
}

function sendJson(req, res, statusCode, payload) {
  setCorsHeaders(req, res);
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
    if (req.method === "OPTIONS") {
      setCorsHeaders(req, res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      sendJson(req, res, 200, { ok: true });
      return;
    }

    if (req.method !== "POST" || req.url !== "/messages") {
      sendJson(req, res, 404, { ok: false, error: "Not found" });
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
        sendJson(req, res, 400, { ok: false, error: "Invalid JSON" });
        return;
      }

      try {
        const message = addMessage(payload);
        onMessage?.(message);
        sendJson(req, res, 201, { ok: true, message });
      } catch (error) {
        sendJson(req, res, 400, {
          ok: false,
          error: error instanceof Error ? error.message : "Invalid payload",
        });
      }
    });

    req.on("error", () => {
      sendJson(req, res, 400, { ok: false, error: "Bad request" });
    });
  });

  server.listen(CHAT_POST_PORT, () => {
    console.log(
      `Chat POST server listening on http://localhost:${CHAT_POST_PORT}`,
    );
  });
}

class ChatTopic {
  mem = {
    messages: [],
  };

  normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  addMessage({ from, message }) {
    const safeFrom = this.normalizeText(from);
    const safeMessage = this.normalizeText(message);

    if (!safeFrom || !safeMessage) {
      throw new Error(
        "Both 'from' and 'message' are required non-empty strings",
      );
    }

    const entry = {
      from: safeFrom,
      message: safeMessage,
    };

    this.mem.messages.push(entry);
    return entry;
  }

  getMessages() {
    return [...this.mem.messages];
  }
}

export const chatTopic = new ChatTopic();
export const topic = "chat";
