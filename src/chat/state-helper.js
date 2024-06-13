import state from "../utils/simple-state";

const messages = [
  { from: "me", message: "first message" },
  { from: "me", message: "soisdf" },
];

export const appState = state({
  user: "user",
  room: "room",
  valid: false,
  showCaptcha: true,
  captchaMatching: false,
  messages: [],
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
}, 5000);
