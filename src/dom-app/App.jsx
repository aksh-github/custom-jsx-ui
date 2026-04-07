import { h, createDom, applyPropsPatches, applyPatches } from "@dom-lib";
import { createSignal, createEffect, createRef } from "../utils/signal-complex";

const Even = () => {
  const [count, setCount] = createSignal(0);

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
  const [count, setCount] = createSignal(1);

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

const [online, setOnlineCtx] = createSignal(true);
const [chatArr, setchatArr] = createSignal(["a", "b", 12505689898]);

const Messages = () => {
  // const arr = chatArr();
  let msgEl = null;

  const Message = ({ index, char }) => {
    return (
      <div>
        {" "}
        <p key={index}>{char} </p>
        <section ignoreNode={true}>this section ignored</section>
      </div>
    );
  };

  const buildList = (init = false) => {
    const Items = () =>
      chatArr().map((char, index) => {
        return <Message index={index} char={char} />;
      });

    if (msgEl)
      if (init) {
        applyPatches([
          {
            op: "APPEND",
            p: msgEl,
            c: Items(),
          },
        ]);
      } else {
        applyPatches([
          {
            op: "REPLACEALL",
            p: msgEl,
            c: Items(),
          },
        ]);
      }
  };

  createEffect(() => {
    chatArr();
    buildList();
  });

  return (
    <div
      className="messages"
      onMount={(el) => {
        msgEl = el;
        buildList(true);
      }}
    ></div>
  );
};

let formEl = null;
const Form = () => {
  const [t, sett] = createSignal("placeholder");
  const [show, setShow] = createSignal(true);
  // const [tel, setTel] = createRef();

  const validate = () => {
    // console.log("validating", t());
    // Add your validation logic here
    return t()?.trim().length > 0 && online(); // Example: non-empty string
  };

  const onInput = (e) => {
    const value = e.target.value;
    // console.log("input value", value);
    sett(value);
  };

  createEffect(() => {
    // console.log("input value", t(), tel);
    const v = online();
    if (formEl) {
      const p = formEl.querySelector("p");
      const inTxt = p.getAttribute("data-t");
      // p.innerText = inTxt + (v ? "Online" : "Offline");
      let flag = validate();

      // formEl.querySelector("[type='submit']").disabled = !flag;
      applyPropsPatches([
        {
          $target: formEl.querySelector("[type='submit']"),
          newProps: { disabled: !flag },
        },
      ]);

      applyPatches([
        {
          p: p,
          op: "CONTENT",
          c: inTxt + (v ? "Online" : "Offline"),
        },
      ]);
    }
  });

  createEffect(() => {
    // console.log("input value", t(), tel);
    const v = t();
    if (formEl) {
      // formEl.querySelector("textarea").value = v;

      let flag = validate();

      // formEl.querySelector("[type='submit']").disabled = !flag;
      applyPropsPatches([
        {
          $target: formEl.querySelector("textarea"),
          newProps: { value: v },
        },
        {
          $target: formEl.querySelector("[type='submit']"),
          newProps: { disabled: !flag },
        },
      ]);
    }
  });

  createEffect(() => {
    const flag = show();
    if (flag) {
      console.log("show");
      // if (formEl)
      // applyPatches([
      //   {
      //     op: "APPEND",
      //     p: formEl.querySelector(".messages"),
      //     c: formEl.querySelector(".messages"),
      //   },
      // ]);
      setchatArr([]);
    } else {
      // if (formEl)
      // applyPatches([
      //   {
      //     op: "REMOVEALL",
      //     p: formEl.querySelector(".messages"),
      //     // c: formEl.querySelector(".messages"),
      //   },
      // ]);
    }
  });

  const submit = (e) => {
    e.preventDefault();
    validate();
    // console.log("submitted", t);

    setchatArr((arr) => [...arr, t()]);
    sett("");
  };

  return (
    <div
      // ref={(el) => (formEl = el)}
      onMount={(el) => {
        formEl = el;
      }}
    >
      <button
        onClick={() => {
          setOnlineCtx(true);
        }}
      >
        Set Online
      </button>
      <button
        onClick={() => {
          setOnlineCtx(false);
        }}
      >
        Set Offline
      </button>
      <p data-t="Online status: ">
        Online status: {online() ? "Online" : "Offline"}
      </p>
      <hr />
      <button
        onClick={() => {
          setShow((s) => !s);
        }}
      >
        Toggle
      </button>
      {show() ? <Messages /> : null}
      <button onClick={() => sett("some text")}>Set Text</button>
      <form onSubmit={submit}>
        <textarea value={t()} onInput={onInput}></textarea>
        <button disabled={!validate()} type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

// const Parent = (props, children) => {
//   console.log(props, children);
//   children[0].props = { ...children[0].props, data: 100 };
//   return children[0];
// };

export const SsrApp = ({ currentUrl }) => {
  const [count, setCount] = createSignal(0);
  const [t, sett] = createSignal("");

  console.log("Counter rendered for URL:", currentUrl);

  createEffect(() => {
    console.log("mounting Counter");

    return () => {
      console.log("unmounting Counter");
    };
  });

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
      {/* <h2>SSR App</h2>
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
      /> */}
      <Form />
    </div>
  );
};
