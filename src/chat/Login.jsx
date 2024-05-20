// import { createSignal, createEffect } from "solid-js";
import { dom, onMount } from "../utils/lib.v2";
import { createSignal, createEffect } from "../utils/signal-complex";
// import { generateCaptcha } from "../utils/utils";

import "./index.css";
import "./welcome.css";

const Login = (props) => {
  console.log(props);
  let userNameTxtRef;
  const [user, setUser] = createSignal("");
  const [room, setRoom] = createSignal("");
  const [valid, setValid] = createSignal(false);

  const clicked = (e) => {
    // if (!isDisabled()) {
    //   setStore({
    //     showCaptcha: false,
    //   });
    //   navigate("/chat");
    // }
  };

  onMount(() => {
    // console.log(userNameTxtRef);
    userNameTxtRef?.focus();
  });

  const isDisabled = () => {
    return !(
      user()?.length > 3 &&
      user()?.length < 11 &&
      room()?.length > 3 &&
      room()?.length < 11
    );
    // return !(
    //   store.user?.length > 3 &&
    //   store.user?.length < 11 &&
    //   store.room?.length > 3 &&
    //   store.room?.length < 11 &&
    //   store.captchaMatching
    // );
    // return user() && room();
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

      <button disabled={isDisabled()} onClick={clicked}>
        Lets Chat
      </button>
    </div>
  );
};

export default Login;
