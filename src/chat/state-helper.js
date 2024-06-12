import state from "../utils/simple-state";

export const appState = state({
  user: "user",
  room: "room",
  valid: false,
  showCaptcha: true,
  captchaMatching: false,
});
