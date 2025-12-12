import { App } from "./App copy";
import { registerRenderCallback } from "../utils/signal-complex";

import {
  h,
  mount,
  smartRegisterCallback,
  createState,
  createEffect,
  createContext,
  memo,
  forceUpdate,
  Lazy,
} from "../utils/vdom/vdom-lib";
import { SimpleSwitch } from "../compos/Switch";
// import { navigoRouter } from "../utils/navigo-router";
// import { registerRenderCallbackV2 } from "../utils/signal-v2";
// import { Sans } from "./sans/sans";
import { TextArea } from "../compos/ComponentPatterns";
import { RouterAdv, LinkV2, Router } from "@router-v2";

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
}, "Child");

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

  const Decide = ({ count }) => {
    // return count % 2 === 0 ? <Even /> : <Odd />;
    // return count % 2 === 0 ? <Even /> : "this is odd";
    return count % 2 === 0 ? <Even /> : <p>this is odd</p>;
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
      <Decide count={count} />
      <hr />
      <form onSubmit={submit}>
        <input value={t} onInput={onInput} onChange={onChange} />
        <button type="submit">Submit</button>
      </form>
      <Child ctr={count} />
    </div>
  );
};

mount(root, () => <RouteTest />);
// mount(root, () => <Sans />);

// Usage

const routeHandler = Router();

function Home(props) {
  return (
    // <h1>Home {props?.a}</h1>
    <div>
      <h1>Home {props?.a}</h1>
      <button
        onClick={() => {
          routeHandler.navigator.go("/route2", { a: 10 });
        }}
      >
        Go to Route 2
      </button>
    </div>
  );
}

function Header() {
  return (
    <p>
      <LinkV2 to="/">Complex</LinkV2> | <LinkV2 to="/route2">About</LinkV2>
    </p>
  );
}

function RouteTest() {
  return (
    <div>
      <Header />
      {/* <hr /> */}
      <RouterAdv
        routeObj={{
          "/": Home,
          "/route2": {
            render: () => (
              <Lazy
                importFn={() => import("./sans/sans")}
                resolve="Sans"
                fallback={<p>Loading Sanskrit...</p>}
              />
            ),
          },
          404: "Not found",
        }}
      />
      <footer>some footer</footer>
    </div>
  );
}
