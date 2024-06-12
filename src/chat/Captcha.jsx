import { h, onMount } from "../utils/vdom/vdom-lib";
// import { setStore } from "../utils/store";
import { createSignal, createEffect } from "../utils/signal-complex";
import { generateCaptcha } from "./utils";
import { appState } from "./state-helper";

const Captcha = () => {
  const [captchaTxt] = createSignal(generateCaptcha());
  const [userCaptchaTxt, setUserCaptchaTxt] = createSignal("");
  const [isFocusOut, setIsFocusOut] = createSignal(false);

  onMount(() => {
    const canv = document.createElement("canvas");
    canv.id = "captcha";
    canv.width = 100;
    canv.height = 50;
    const ctx = canv.getContext("2d");

    if (ctx) {
      ctx.font = "25px Georgia";
      ctx.strokeText(captchaTxt(), 0, 30);
      //storing captcha so that can validate you can save it somewhere else according to your specific requirements

      document.getElementById("captcha")?.appendChild(canv);
    }
  });

  return () => (
    <div className="captcha-container">
      <div id="captcha"></div>
      <input
        placeholder="Captcha Text"
        minLength={4}
        maxLength={10}
        value={userCaptchaTxt()}
        onInput={(e) => {
          const v = e.currentTarget.value;
          setUserCaptchaTxt(v);
          // console.log("blur", userCaptchaTxt(), captchaTxt());
          appState.set({
            captchaMatching: userCaptchaTxt() === captchaTxt(),
          });
        }}
        onBlur={() => {
          setIsFocusOut(true);
        }}
      />
      {userCaptchaTxt() !== captchaTxt() && isFocusOut() ? (
        <p> Please provide correct captcha text. </p>
      ) : null}
    </div>
  );
};

export default Captcha;
