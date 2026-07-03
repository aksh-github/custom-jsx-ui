import { publishStreamTopic, registerStreamTopic } from "./streaming.js";
import { startChatServer } from "./chat-server.js";

// chat start
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

const chatTopic = new ChatTopic();
const topic = "/chat";

registerStreamTopic(topic, (ctx) => {
  ctx.send({ messages: chatTopic.getMessages() }, "chat-snapshot");
});

startChatServer({
  addMessage: (payload) => chatTopic.addMessage(payload),
  onMessage: (message) => {
    publishStreamTopic(topic, { message }, { type: "chat-message" });
  },
});

// chat end

registerStreamTopic("stock", (ctx) => {
  const timer = setInterval(() => {
    const value = Math.floor(Math.random() * 100) + 1;
    ctx.send({ value }, "stock");
  }, 4000);

  return () => clearInterval(timer);
});

registerStreamTopic("time", (ctx) => {
  const timer = setInterval(() => {
    ctx.send(
      {
        isoTime: new Date().toISOString(),
        epochMs: Date.now(),
      },
      "time",
    );
  }, 10000);

  return () => clearInterval(timer);
});

registerStreamTopic("time", (ctx) => {
  const timer = setInterval(() => {
    ctx.send(
      {
        isoTime: new Date().toISOString(),
        epochMs: Date.now(),
      },
      "time",
    );
  }, 10000);

  return () => clearInterval(timer);
});

const messages = [];

registerStreamTopic("chat", (ctx) => {});
