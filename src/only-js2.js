import { createSignal } from "./utils/signal-complex";

let hold = [];

// let firstRun = true;
let callStack = [];
let counter = 0;

function unMount(cb) {
  // hold.pop()?.();
  //   hold.push(cb);
  hold[counter] = cb;
}

const Even = () => {
  console.log("Even once");

  unMount(() => {
    console.log("uM() for Even");
  });

  return (props) => {
    // console.log(props);
    return "Even render";
  };
};

const Odd = () => {
  console.log("Odd once");

  unMount(() => {
    console.log("uM() for Odd");
  });

  return (props) => {
    // console.log(props);
    return "Odd render";
  };
};

const App = () => {
  console.log("App once");
  const [s, sets] = createSignal(100);

  unMount(() => {
    console.log("uM() for App");
  });

  return (props) => {
    // console.log(props.p);
    sets(s() + 100);
    console.log(s());
    return ["App render " + s(), caller(props.fn, props.param)];
  };
};

function reset() {
  counter = 0;
}

function caller(fn, rest) {
  // console.log("here we need which unmount to be called");
  let _fn = null;

  if (callStack[counter]?.fname !== fn.name) {
    console.log(fn.name, " not found");
    const unMountTobeCalledFor = callStack.splice(counter, 1);

    _fn = fn(rest);
    callStack.push({ fname: fn.name, fn: _fn });
    console.log(hold[counter]);
  } else {
    _fn = callStack[counter].fn;
    console.log(hold[counter]);
  }
  counter++;

  return _fn(rest);
}

// for simple

// console.log(caller(App));

// console.log(caller(App, { p: "app props", fn: Even, param: "even props" }));

// reset();
// console.log(caller(App, { p: "app props", fn: Even, param: "even props" }));

// console.log(counter, callStack);

// // hard reset

// reset();
// console.log(caller(App, { p: "app props", fn: Odd, param: "odd props" }));

// console.log(counter, callStack);

// for complex

// for (let i = 0; i < 3; ++i) {
//   reset();
//   if (i % 2 !== 0) {
//     console.log(caller(App, { p: "app props", fn: Even, param: "even props" }));
//   } else {
//     console.log(caller(App, { p: "app props", fn: Odd, param: "odd props" }));
//   }
// }

// console.log(hold);
