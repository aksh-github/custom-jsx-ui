import { createSignal, batch } from "./utils/signal-complex";
import { dom, forceUpdate } from "./utils/lib";
import Link from "./compos/Link";

const state = (iv) => {
  let st = {
    ...iv,
  };

  return {
    get: (key) => {
      return st[key];
    },
    set: (nv) => {
      st = {
        ...st,
        ...nv,
      };
      forceUpdate();
    },
  };
};

const Wrapper = () => {
  const st = state({ c: 100, version: "Loading..." });

  setTimeout(() => {
    fetch("/package.json")
      .then((res) => res.json())
      .then((res) => {
        st.set({
          version: res.version,
        });
      });
  }, 4000);

  const Ctr = ({ v, __spl }) => {
    return (
      <div style={{ background: "orange", padding: "2em" }}>
        <h3>Child</h3>
        <p>Parent ctr: {v}</p>
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

  const input = state({
    input: {
      v: "some",
      e: "eer",
    },
  });

  const Input = () => {
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

  return {
    Ctr: Ctr,
    Input: Input,
  };
};

// const [cc, setcc] = createSignal(0);

const [c, setc] = createSignal(0);
const [s, sets] = createSignal("akshay");
const { Ctr, Input } = Wrapper();

export function App(props) {
  console.log("rendered App", props);

  return (
    <div>
      hello world {c()}
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
      <Input />
      <p>
        <Link href="/route2">Go next</Link>
      </p>
    </div>
  );
}

export function SimpleRoute() {
  return (
    <div>
      route2
      <Link href="/">Go next</Link>
    </div>
  );
}
