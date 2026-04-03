import {
  h,
  createState,
  createEffect,
  createContext,
  memo,
  forceUpdate,
  Switch,
} from "@vdom-lib";
// import { Lazy } from "../utils/vdom/lazy";
import { DynSans, DynTextArea } from "../compos/DynamicExports";
import { Loader } from "../utils/vdom/loader";
// import { Sans } from "../vdom-app/sans/sans";

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

// const Parent = (props, children) => {
//   console.log(props, children);
//   children[0].props = { ...children[0].props, data: 100 };
//   return children[0];
// };

export const SsrApp = ({ currentUrl }) => {
  const [count, setCount] = createState(0);
  const [t, sett] = createState("");

  console.log("Counter rendered for URL:", currentUrl);

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
      <h2>SSR App</h2>
      <p>Counter: {count}</p>
      <p
        style={{
          backgroundColor: "lightblue",
          padding: "10px",
        }}
        className="some-class"
      >
        {ctx.get()}
      </p>
      <p>
        {null}
        {undefined}
        {true}
        {false}
      </p>
      <script id="dyn-script">alert(10)</script>
      <a href="javascript:alert(10)">Dangerous link</a>
      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
      <hr />
      <Decide count={count} />
      <hr />
      <Switch value={10}>
        <Switch.Case when={10} render={() => "this is 10"} />
        <Switch.Case
          when={20}
          render={() => (
            <div
              className="some-20"
              style={{
                background: "beige",
              }}
            >
              this is 20
            </div>
          )}
        />
        <Switch.Default>
          <div>This is the default case</div>
        </Switch.Default>
      </Switch>
      <hr />
      <DynTextArea />
      <form onSubmit={submit}>
        <input value={t} onInput={onInput} onChange={onChange} />
        <button type="submit">Submit</button>
      </form>
      <Child ctr={count} />

      <div ignoreNode={true}>this should be ignored</div>

      <Loader
        promiseFn={someFetch}
        loading="Loading..."
        error="Error loading data"
        key={"api/1"}
        onLoad={(data) => <LoaderTest data={data} />}
      />

      <Loader
        promiseFn={someFetch2}
        loading="Loading..."
        error="Error loading data"
        key={"api/2"}
        onLoad={(data) => <LoaderTest2 data={data} />}
      />
    </div>
  );
};

function someFetch() {
  return fetch("http://localhost:3000/api/1");
}

function someFetch2() {
  return fetch("http://localhost:3000/api/2");
}

someFetch().catch(() => {
  console.log("this catch block is necc for SSR");
});

export function LoaderTest(props) {
  console.log("LoaderTest props", props);
  return (
    // <h1>Home {props?.a}</h1>
    <section>
      <h1>LoaderTest</h1>
      <p>{JSON.stringify(props?.data)}</p>
      <button
        onClick={() => {
          routerInstance.navigator.go("/route2", { a: 10 });
        }}
      >
        Go to Route 2
      </button>
    </section>
  );
}

export function LoaderTest2(props) {
  return (
    // <h1>Home {props?.a}</h1>
    <section>
      <h1>LoaderTest2 {props?.a}</h1>
      <p>{JSON.stringify(props?.data)}</p>
      <button
        onClick={() => {
          routerInstance.navigator.go("/route2", { a: 10 });
        }}
      >
        Go to Route 2
      </button>
    </section>
  );
}
