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

export const socketState = state({
  socket: null,
  publicKey: "",
});

// global signal

export const [enable, setEnable] = createSignal(false);
export const [online, isOnline] = createSignal(false);
