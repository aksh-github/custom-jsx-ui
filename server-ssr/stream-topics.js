import { publishStreamTopic, registerStreamTopic } from "./streaming.js";

// chat start
import { startChatServer, chatTopic, topic } from "./chat-server.js";

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

registerStreamTopic("file", (ctx) => {
  const sentence =
    "This is an example demonstrating chunked file streaming functionality";

  const chunks = sentence.split(" ");

  let index = 0;

  const intervalId = setInterval(() => {
    if (index < chunks.length) {
      const word = chunks[index];
      // Stream the word with a specific type for clarity
      ctx.send({ word: word }, "word");
      index++;
    } else {
      clearInterval(intervalId);
      // Signal that streaming is complete
      ctx.send({ finished: true }, "end");
    }
  }, 400);

  return () => clearInterval(intervalId);
});

registerStreamTopic("component", (ctx) => {
  const tout = setTimeout(() => {
    ctx.send(
      {
        all: [
          {
            type: "p",
            updtFlag: true,
            props: { style: { backgroundColor: "green", color: "white" } },
            children: ["Streamed p"],
          },
          {
            type: "p",
            updtFlag: true,
            props: { style: { backgroundColor: "red", color: "white" } },
            children: ["Streamed p"],
          },
          {
            type: "p",
            updtFlag: true,
            props: { style: { backgroundColor: "blue", color: "white" } },
            children: ["Streamed p"],
          },
        ],
      },
      "part",
    );
    // Signal that streaming is complete
    ctx.send({ finished: true }, "end");
  }, 4000);

  return () => clearTimeout(tout);
});
