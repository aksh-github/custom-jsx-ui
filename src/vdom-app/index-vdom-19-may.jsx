import { App } from "./App";
import { registerRenderCallback } from "../utils/signal-complex";
import {
  // registerCallback,
  smartRegisterCallback,
  createState,
  createEffect,
  createContext,
} from "../utils/simple-state";
import { h, mount, forceUpdate } from "../utils/vdom/vdom-lib";
import { SimpleSwitch } from "../compos/Switch";
// import { navigoRouter } from "../utils/navigo-router";
import { registerRenderCallbackV2 } from "../utils/signal-v2";
import { Sans } from "./sans/sans";
import { TextArea } from "../compos/ComponentPatterns";
import { memo } from "../utils/vdom/memo";

// =======================

// fresh extensive test

const root = document.getElementById("root-vdom");
// for non router
// mount(root, () => <App some={2} />);

// for signal
// registerRenderCallback(forceUpdate);

// for signal v2
// registerRenderCallbackV2(forceUpdate);

// for my state
// registerCallback(forceUpdate);
smartRegisterCallback(forceUpdate, 50);

const ctx = createContext(0);
const nameCtx = createContext("Aks");

const Even = () => {
  const [count, setCount] = createState(0);

  createEffect(() => {
    console.log("mounting Even");

    return () => {
      console.log("unmounting Even");
    };
  }, []);

  return (
    <div>
      <h2>Even Component</h2>
      <p>
        This is the Even component.
        {count}
      </p>
      <button
        onClick={() => {
          setCount((count) => count + 2);
          ctx.set((c) => c + 1);
        }}
      >
        Increment
      </button>
    </div>
  );
};

const Odd = () => {
  const [count, setCount] = createState(1);

  createEffect(() => {
    console.log("mounting Odd");

    return () => {
      console.log("unmounting Odd");
    };
  }, []);

  return (
    <div>
      <h2>Odd Component</h2>
      <p>
        This is the Odd component.
        {count}
      </p>
      <p>{nameCtx.get()}</p>
      <button
        onClick={() => {
          ctx.set((c) => c + 1);

          setCount((count) => count + 2);
          nameCtx.set("hello world");
        }}
      >
        Increment
      </button>
    </div>
  );
};

const Child = memo(({ ctr }) => {
  console.log("Child executed");
  return <p>{ctr}</p>;
});

const Counter = () => {
  const [count, setCount] = createState(0);
  const [t, sett] = createState("");

  console.log("Counter");

  createEffect(() => {
    console.log("mounting Counter");

    return () => {
      console.log("unmounting Counter");
    };
  }, []);

  const validate = () => {
    console.log("validating", t);
    // Add your validation logic here
    return t.length > 0; // Example: non-empty string
  };

  const submit = (e) => {
    e.preventDefault();
    validate();
    // Perform the submit action
    console.log("submitted", t);
    sett("");
  };

  const onInput = (e) => {
    const value = e.target.value;
    console.log("input value", value);
    sett(value);
  };

  const onChange = (e) => {
    const value = e.target.value;
    console.log("change value", value);
    sett(value);
  };

  return (
    <div>
      <h2>Counter: {count}</h2>
      <p
        style={{
          backgroundColor: "lightblue",
          padding: "10px",
        }}
      >
        {ctx.get()}
      </p>
      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
      <hr />
      {count % 2 === 0 ? <Even /> : <Odd />}
      <hr />
      <form onSubmit={submit}>
        <input value={t} onInput={onInput} />
        <button type="submit">Submit</button>
      </form>
      <Child ctr={count} />
    </div>
  );
};

mount(root, () => <Counter />);
// mount(root, () => <Sans />);

function Svg() {
  return (
    <button>
      Search{" "}
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    </button>
  );
}

function Captcha() {
  createEffect(() => {
    const canvas = document.getElementById("captcha");
    const ctx = canvas.getContext("2d");

    // Set font properties
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Write sample text
    const captchaText = generateCaptcha();
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);

    // Strike through the text
    ctx.strokeStyle = "red"; // Color of the strike-through line
    ctx.lineWidth = 2; // Thickness of the strike-through line
    ctx.lineCap = "round"; // Rounded ends for the line

    const strikeThroughX = canvas.width / 2;
    const strikeThroughY = canvas.height / 2;
    const strikeThroughLength = captchaText.length * 20; // Adjust based on font size

    ctx.beginPath();
    ctx.moveTo(strikeThroughX - strikeThroughLength / 2, strikeThroughY);
    ctx.lineTo(strikeThroughX + strikeThroughLength / 2, strikeThroughY);
    ctx.stroke();
  }, []);

  return <canvas id="myCanvas" height="50"></canvas>;
}

{
  /* <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
      <symbol id="icon-back" viewBox="0 0 24 24">
        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
      </symbol>

      <symbol id="icon-download" viewBox="0 0 24 24">
        <path d="M5 18h14v2H5v-2zm4.6-6.6l2.2 2.2 4.8-4.8L14.4 8 10.2 4.8 7.8 7z" />
        <path d="M19.7 8.3l-4.8 4.8L14.4 16 10.2 19.2 7.8 16l2.2-2.2L10.2 8.3 7.8 5.7 4.6 8.3z" />
      </symbol>

      <symbol id="icon-upload" viewBox="0 0 24 24">
        <path d="M5 18h14v2H5v-2zm4.6-6.6l2.2 2.2 4.8-4.8L14.4 8 10.2 4.8 7.8 7z" />
        <path
          d="M19.7 8.3l-4.8 4.8L14.4 16 10.2 19.2 7.8 16l2.2-2.2L10.2 8.3 7.8 5.7 4.6 8.3z"
          transform="rotate(180 12 12)"
        />
      </symbol>
    </svg>
    <svg width="24" height="24">
      <use xlink:href="#icon-download"></use>
    </svg> */
}
