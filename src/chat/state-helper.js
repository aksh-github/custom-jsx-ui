import { createSignal } from "../utils/signal-complex";
import state from "../utils/simple-state";

export const appState = state({
  user: "user",
  room: "room",
  valid: false,
  showCaptcha: true,
  captchaMatching: false,
  messages: [],
  to: "",
});

setTimeout(() => {
  appState.set({
    messages: [
      ...appState.get().messages,
      { from: "dumy", message: "how are ou" },
      { from: "dumy", message: "what doing?" },
      { from: "me", message: "good" },
    ],
  });

  appState.set({
    messages: [
      ...appState.get().messages,
      {
        from: "system",
        message: "dumy" + " left the chat",
        type: "notification",
      },
    ],
  });
}, 5000);

export const socketState = state({
  socket: null,
  publicKey: "",
});

// global signal

export const [enable, setEnable] = createSignal(false);
export const [online, isOnline] = createSignal(false);
