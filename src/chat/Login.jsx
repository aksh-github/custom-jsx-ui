import { h, onMount } from "../utils/vdom/vdom-lib";
import { createSignal, createEffect } from "../utils/signal-complex";
// import { generateCaptcha } from "../utils/utils";

import navigoRouter from "../utils/navigo-router";
import { appState } from "./state-helper";

const Login = (props) => {
  console.log(props);
  let userNameTxtRef;
  const [user, setUser] = createSignal(appState.get("user"));
  const [room, setRoom] = createSignal(appState.get("room"));
  // const [valid, setValid] = createSignal(false);

  const clicked = (e) => {
    if (isValid()) {
      // setStore({
      //   showCaptcha: false,
      // });
      appState.set({
        user: user(),
        room: room(),
        valid: isValid(),
      });
      navigoRouter.get().navigate("/chat");
    }
  };

  onMount(() => {
    // console.log(userNameTxtRef);
    userNameTxtRef?.focus();
  });

  const isValid = () => {
    return (
      user()?.length > 3 &&
      user()?.length < 11 &&
      room()?.length > 3 &&
      room()?.length < 11
    );
  };

  return () => (
    <div className="welcome">
      <h2>Solid Chat</h2>
      <input
        placeholder="User name"
        minLength={4}
        ref={(_userNameTxtRef) => (userNameTxtRef = _userNameTxtRef)}
        maxLength={10}
        value={user()}
        onInput={(e) => {
          const v = e.target.value;
          setUser(v?.trim());
          // setStore({
          //   user: v?.trim(),
          // });
        }}
      />

      <input
        placeholder="Room name"
        minLength={4}
        maxLength={10}
        value={room()}
        onInput={(e) => {
          const v = e.target.value;
          setRoom(v?.trim());
          // setStore({
          //   room: v?.trim(),
          //   messages: [], //reset msgs
          // });
        }}
      />

      {/* {store.showCaptcha ? <Captcha /> : null} */}

      <button disabled={!isValid()} onClick={clicked}>
        Lets Chat
      </button>
    </div>
  );
};

export default Login;
