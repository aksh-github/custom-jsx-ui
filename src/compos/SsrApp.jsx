import {
  h,
  createState,
  createEffect,
  createContext,
  memo,
  Switch,
  Lazy,
  createResource,
} from "@vdom-lib";
// import { Lazy } from "../utils/vdom/lazy";
import { DynSans, DynTextArea } from "./DynamicExports";
// import { Sans } from "../vdom-app/sans/sans";

const ctx = createContext(0);
const nameCtx = createContext("Aks");

const onlineCtx = createContext(false);
const chatArr = createContext(["a", "b", "c"]);

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

const Child = ({ ctr }) => {
  console.log("Child executed");
  return <p>{ctr}</p>;
};

const Messages = () => {
  const arr = chatArr.get();

  return (
    <div>
      {arr.map((char, index) => {
        return (
          <div>
            {" "}
            <p key={index}>{char} </p>
            <section ignoreNode={true}>this section ignored</section>
          </div>
        );
      })}
    </div>
  );
};

const Form = () => {
  const [t, sett] = createState("");

  const validate = () => {
    console.log("validating", t);
    // Add your validation logic here
    return t?.trim().length > 0 && onlineCtx.get(); // Example: non-empty string
  };

  const onInput = (e) => {
    const value = e.target.value;
    console.log("input value", value);
    sett(value);
  };

  const submit = (e) => {
    e.preventDefault();
    validate();
    // console.log("submitted", t);
    sett("");
    chatArr.set((arr) => [...arr, t]);
  };

  return (
    <div>
      {onlineCtx.get() ? (
        <button onClick={() => sett("some text")}>Set Text</button>
      ) : null}
      <button
        onClick={() => {
          onlineCtx.set(true);
        }}
      >
        Set Online
      </button>
      <button
        onClick={() => {
          onlineCtx.set(false);
        }}
      >
        Set Offline
      </button>
      <p>Online status: {onlineCtx.get() ? "Online" : "Offline"}</p>
      <hr />
      <Messages />
      {onlineCtx.get() ? (
        <button onClick={() => sett("some text")}>Set Text</button>
      ) : null}
      <form onSubmit={submit}>
        <textarea value={t} onInput={onInput}></textarea>
        <button disabled={!validate()} type="submit">
          Submit
        </button>
      </form>
      {onlineCtx.get() ? (
        <button onClick={() => sett("some text")}>Set Text</button>
      ) : null}
    </div>
  );
};

const CustomSwitch = ({ value, elements }) => {
  let defaultCase = undefined;

  const caseToRender = elements.find((child) => {
    // console.log("child", child);
    if (child.when === value) {
      return true;
    }
    if (child.default) {
      defaultCase = child;
    }
    return false;
  });

  if (caseToRender) {
    return caseToRender.render();
  } else {
    if (defaultCase) {
      return defaultCase.render();
    } else {
      return null;
    }
  }
};

async function getLazyVal(params) {
  const lazyVal = "lazy val";
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return lazyVal;
}

const SmallLazy = () => {
  const response = createResource(() => getLazyVal());
  console.log(response);

  if (response?.loading)
    return (
      <p>
        <span className="typing"></span>
        <span className="typing"></span>
        <span className="typing"></span>
      </p>
    );

  return response?.result;
};

const Decide = ({ count }) => {
  return count % 2 === 0 ? <Even /> : <Odd />;
  // return count % 2 === 0 ? <Even /> : "this is odd";
  // return count % 2 === 0 ? <Even /> : <p>this is odd</p>;
  // return count % 2 === 0 ? "this is even" : <Odd />;
  // return count % 2 === 0 ? <p>this is odd</p> : null;
  // return count % 2 === 0 ? null : <p>this is odd</p>;
  // return count % 2 === 0 ? undefined : <Odd />;
  // return count % 2 === 0 ? undefined : <SmallLazy />;
};

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
      {/*<Switch value={20}>
        <Switch.Case when={10} render={() => "this is 10"} />
        <Switch.Case
          when={20}
          render={() => (
            <div
              className="some-20"
              style={{
                background: "blue",
              }}
            >
              this is 20
            </div>
          )}
        />
        <Switch.Default>
          <div>This is the default case</div>
        </Switch.Default>
      </Switch> */}

      <hr />
      <CustomSwitch
        value={20}
        elements={[
          { when: 10, render: () => "this is 10" },
          {
            when: 20,
            render: () => (
              <div className="some-20" style={{ background: "blue" }}>
                this is 20
              </div>
            ),
          },
          { default: true, render: () => <div>This is the default case</div> },
        ]}
      />
      <DynTextArea key="oscs" />
      <form onSubmit={submit}>
        <input value={t} onInput={onInput} onChange={onChange} />
        <button type="submit">Submit</button>
      </form>
      <Child ctr={count} />

      <div ignoreNode={true}>this should be ignored</div>

      <Form />

      <ResourceTest id={1} key={"k1"} />
      <ResourceTest id={2} key={"k2"} />
    </div>
  );
};

function someFetch(id) {
  return fetch(`http://localhost:3000/api/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Something wrong");
    })
    .catch((err) => {
      console.log("this catch block is necc for SSR");
      return err?.message;
    });
}

// someFetch();

export function ResourceTest({ id, key }) {
  const resource = createResource(() => someFetch(id));

  console.log(resource);

  return (
    <section>
      <h1>ResourceTest {key}</h1>
      <p>{resource?.loading}</p>
      <p>{resource?.error}</p>
      <p>{JSON.stringify(resource?.result)}</p>
    </section>
  );
}
