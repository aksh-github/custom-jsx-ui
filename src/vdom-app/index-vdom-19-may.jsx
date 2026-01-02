import { App } from "./App";

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

// import { Sans } from "./sans/sans";
import { RouterAdv, LinkV2 } from "@router-v2";
import { routerInstance, routerContext } from "../utils/router-v2";
import { PerfTest } from "../compos/PerfTest";

// =======================

// fresh extensive test

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

const style = {
  backgroundColor: "lightblue",
  padding: "10px",
};

const Counter = () => {
  const [count, setCount] = createState(-1);
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
    return count % 2 === 0 ? <Even /> : <Odd />;
    // return count % 2 === 0 ? <Even /> : "this is odd";
    // return count % 2 === 0 ? <Even /> : <p>this is odd</p>;
    // return count % 2 === 0 ? "this is even" : <Odd />;
  };

  return (
    <div>
      <h2>Counter: {count}</h2>
      <p style={style}>{ctx.get()}</p>
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

const root = document.getElementById("root-vdom");
mount(root, () => <App type2="switch" />);
// mount(root, () => <Sans />);

// Usage

function Home(props) {
  return (
    // <h1>Home {props?.a}</h1>
    <div>
      <h1>Home {props?.a}</h1>
      <button
        onClick={() => {
          routerInstance.navigator.go("/route2", { a: 10 });
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
      <LinkV2 key="/" to="/">
        Complex
      </LinkV2>{" "}
      |{" "}
      <LinkV2 key="/counter" to="/counter">
        Counter
      </LinkV2>
    </p>
  );
}

function RouteSwitch({ curPath }) {
  switch (curPath) {
    case "/":
      return <Home />;

    case "/counter":
      return <Counter />;
    default:
      return "Not found 404";
  }
}

function RouteTest() {
  console.log(routerContext.get());
  const curPath = routerContext.get()?.pathname || "/";

  return (
    <div>
      <Header />
      <hr />
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
      <p>Current Route: {curPath}</p>
      <RouteSwitch curPath={curPath} />
      {/* <footer>some footer</footer> */}
    </div>
  );
}
