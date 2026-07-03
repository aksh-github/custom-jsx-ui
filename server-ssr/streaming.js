const DEFAULT_KEEPALIVE_MS = 20000;

const topicHandlers = new Map();
const topicClients = new Map();

function normalizeTopic(topic) {
  return String(topic || "").trim();
}

function getOrCreateSet(map, key) {
  if (!map.has(key)) {
    map.set(key, new Set());
  }
  return map.get(key);
}

function writeChunk(res, payload) {
  if (res.writableEnded || res.destroyed) {
    return false;
  }

  try {
    return res.write(`${JSON.stringify(payload)}\n`);
  } catch {
    return false;
  }
}

function removeClient(client) {
  const clients = topicClients.get(client.topic);
  if (!clients) {
    return;
  }

  clients.delete(client);
  if (clients.size === 0) {
    topicClients.delete(client.topic);
  }
}

function collectHandlers(topic) {
  const handlers = [];
  const exact = topicHandlers.get(topic);
  const wildcard = topicHandlers.get("*");

  if (exact) {
    handlers.push(...exact);
  }

  if (wildcard) {
    handlers.push(...wildcard);
  }

  return handlers;
}

export function registerStreamTopic(topic, handler) {
  const normalizedTopic = normalizeTopic(topic);

  if (!normalizedTopic) {
    throw new Error("registerStreamTopic requires a non-empty topic");
  }

  if (typeof handler !== "function") {
    throw new Error("registerStreamTopic requires a function handler");
  }

  const handlers = getOrCreateSet(topicHandlers, normalizedTopic);
  handlers.add(handler);

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      topicHandlers.delete(normalizedTopic);
    }
  };
}

export function publishStreamTopic(topic, data, options = {}) {
  const normalizedTopic = normalizeTopic(topic);
  if (!normalizedTopic) {
    return 0;
  }

  const clients = topicClients.get(normalizedTopic);
  if (!clients || clients.size === 0) {
    return 0;
  }

  let sentCount = 0;
  const chunk = {
    type: options.type || "message",
    topic: normalizedTopic,
    data,
    ts: Date.now(),
  };

  for (const client of [...clients]) {
    const ok = writeChunk(client.res, chunk);
    if (ok) {
      sentCount += 1;
    } else {
      removeClient(client);
    }
  }

  return sentCount;
}

export function createStreamRouteHandler({
  keepAliveMs = DEFAULT_KEEPALIVE_MS,
} = {}) {
  return function streamRouteHandler(req, res) {
    const topic = normalizeTopic(req.query?.q);

    if (!topic) {
      res.status(400).json({
        error: "Missing required query param: q",
      });
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const client = { topic, res };
    getOrCreateSet(topicClients, topic).add(client);

    const cleanupFns = [];
    let closed = false;
    let heartbeat = null;

    const close = () => {
      if (closed) {
        return;
      }

      closed = true;
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      for (const cleanup of cleanupFns) {
        try {
          cleanup();
        } catch {
          // Keep closing even if a user cleanup throws.
        }
      }

      removeClient(client);

      if (!res.writableEnded) {
        res.end();
      }
    };

    const send = (data, type = "message") => {
      const ok = writeChunk(res, {
        type,
        topic,
        data,
        ts: Date.now(),
      });

      if (!ok) {
        close();
      }

      return ok;
    };

    const publish = (data, options = {}) =>
      publishStreamTopic(topic, data, options);

    const registerCleanup = (cleanupFn) => {
      if (typeof cleanupFn === "function") {
        cleanupFns.push(cleanupFn);
      }
    };

    const ctx = {
      req,
      res,
      topic,
      send,
      publish,
      close,
      registerCleanup,
    };

    send({ connected: true }, "ready");

    const handlers = collectHandlers(topic);
    for (const handler of handlers) {
      try {
        const maybeCleanup = handler(ctx);
        registerCleanup(maybeCleanup);
      } catch (error) {
        send(
          {
            message: "Stream handler failed",
            detail: error instanceof Error ? error.message : String(error),
          },
          "error",
        );
      }
    }

    heartbeat = setInterval(() => {
      send({ ok: true }, "heartbeat");
    }, keepAliveMs);

    req.on("close", close);
    req.on("aborted", close);
  };
}
