import { createSignal, batch, createEffect } from "./utils/signal-complex";
import { dom, mount, unMount } from "./utils/lib.v2";
import Link from "./compos/Link";
import state from "./utils/simple-state";
// import { useState } from "./utils/hooks-experi";

// Ctr

const Ctr = ({ v, __spl }) => {
  const st = state({ c: 100, version: "Loading..." });

  let timer = null;

  unMount(() => {
    console.log("unmount Ctr");
    clearTimeout(timer);
  });

  timer = setTimeout(() => {
    fetch("/package.json")
      .then((res) => res.json())
      .then((res) => {
        st.set({
          version: res.version,
        });
      });
  }, 4000);

  return (props) => {
    // console.log(props);
    return (
      <div style={{ background: "orange", padding: "2em" }}>
        <h3>Child</h3>
        <p>Parent ctr: {props.v}</p>
        <p>My ctr: {st.get("c")}</p>
        <p>Json Value: {st.get("version")}</p>
        <button
          onClick={(e) => {
            // setcc(cc() + 1);
            st.set({ c: st.get("c") + 1 });
          }}
        >
          click
        </button>
      </div>
    );
  };
};

// end Ctr

const Input = () => {
  const input = state({
    input: {
      v: "some",
      e: "eer",
    },
  });

  unMount(() => {
    console.log("unmount Input");
  });

  return () => {
    return (
      <div>
        {[10, 20, 30].map((it) => {
          return <p>{it}</p>;
        })}
        <input
          className="input"
          onInput={(e) => {
            // console.log(e, e.target.value);
            input.set({
              input: {
                v: e.target.value,
                e: e.target.value ? "" : "incorrect",
              },
            });
          }}
          value={input.get("input").v}
        />
        <p>{input.get("input").e}</p>
      </div>
    );
  };
};

export function App(props) {
  console.log("rendered App", props);
  const [c, setc] = createSignal(0);
  const [s, sets] = createSignal("akshay");

  createEffect(() => {
    console.log(c());
  });

  unMount(() => {
    console.log("unmount app");
  });

  return () => (
    <div>
      hello world {c()} {s()}
      <div>
        <button
          onClick={(e) => {
            batch(() => {
              setc(c() + 1);
              sets("akshay is smart");
            });
          }}
        >
          Counter
        </button>
      </div>
      <Ctr v={c()} />
      <Ctr v={c()} />
      <Input />
      <p>
        <Link href="/route2">Go next</Link>
      </p>
    </div>
  );
}

// SimpleRoute

// const pst = state({ r: 0 });

const Even = () => {
  mount(() => {
    console.log("mount for Even");
  });

  unMount(() => {
    console.log("unmount for Even");
  });

  return () => "Divisible by 2";
};
// const Odd = () => () => "NOT Divisible";
const Odd = () => {
  mount(() => {
    console.log("mount for Odd");
  });

  unMount(() => {
    console.log("unmount for Odd");
  });

  return () => "Not Divisible";
};

export const SimpleRoute = () => {
  // const [r, setr] = createSignal(0);
  const pst = state({ r: 0 });
  // const tv = pst.get("r");
  let ref = null;

  mount(() => {
    console.log("Ref available in mount for SimpleRoute", ref);
  });

  unMount(() => {
    console.log("unmount for SimpleRoute");
  });

  return () => {
    console.log(pst.get("r"));
    return (
      <div ref={(_ref) => (ref = _ref)}>
        route2
        <Link href="/">Go Back</Link>
        <div>
          <h3>{pst.get("r") % 2 === 0 ? <Even /> : <Odd />}</h3>
          <button onClick={() => pst.set({ r: pst.get("r") + 1 })}>
            Change
          </button>
        </div>
      </div>
    );
  };
};

// SimpleRoute
