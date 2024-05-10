import { createSignal, batch } from "./utils/signal-complex";
import { dom, forceUpdate } from "./utils/lib";
import Link from "./compos/Link";
import state from "./utils/simple-state";

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

// const [cc, setcc] = createSignal(0);

const [c, setc] = createSignal(0);
const [s, sets] = createSignal("akshay");
// const { Ctr, Input } = Wrapper();

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

// SimpleRoute

const pst = state({ r: 0 });

const Even = () => "Divisible by 2";
const Odd = () => "Odd";

export function SimpleRoute() {
  return (
    <div>
      route2
      <Link href="/">Go Back</Link>
      <div>
        <h3>
          {pst.get("r")} is {pst.get("r") % 2 === 0 ? <Even /> : <Odd />}
        </h3>
        <button onClick={() => pst.set({ r: pst.get("r") + 1 })}>Change</button>
      </div>
    </div>
  );
}

// SimpleRoute
