import { dom, reRender, render } from "./utils/lib.v2.test";
import {
  createSignal,
  createEffect,
  registerRenderCallback,
  untrack,
  h,
} from "./utils/signal-complex";
import { render2 } from "./utils/signals-simple";

// this is test experimental

const [c, setc] = createSignal(0);

const Ctr = ({ v }) => {
  console.log("Ctr");

  return (
    <div>
      <p>Parent ctr: {v}</p>
      <p>My ctr: {c()}</p>
      <button
        onClick={(e) => {
          setc(c() + 1);
        }}
      >
        click
      </button>
    </div>
  );
};

const SomeCompo = ({ v }) => {
  console.log("SomeCompo");
  return () => (v % 2 === 0 ? <div>Even</div> : <div>Odd</div>);
};

function App() {
  const [c, setc] = createSignal(0);
  const [s, sets] = createSignal("akshay");
  console.log("rendered App");

  return () => (
    <div>
      hello world {c()}
      <div>
        <button
          onClick={(e) => {
            // ctr += 1;
            console.log("think about batch");
            setc(c() + 1);
            sets("akshay is smart");
            // reRender();
          }}
        >
          Counter
        </button>
      </div>
      <hr />
      <Ctr v={c()} />
      {/* <SomeCompo v={c()} /> */}
    </div>
  );
}

// for UI
const root = document.getElementById("root");
render(root, App());

// for signal
registerRenderCallback(reRender);

// test

// function inner() {
//   console.log("inner");
//   return () => {
//     return "outer " + inner();
//   };
// }

// function outer() {
//   console.log("outer");

//   return () => {
//     return "outer " + inner();
//   };
// }

// render2(outer);

// render2(outer);

// render2(outer);

// test end
