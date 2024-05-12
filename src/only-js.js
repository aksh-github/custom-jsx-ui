let hold = [];

function unMount(cb) {
  // hold.pop()?.();
  hold.push(cb);
}

const Even = (() => {
  // console.log("Even once");

  unMount(() => {
    console.log("uM() for Even");
  });

  return (props) => {
    console.log(props);
    return "Even render";
  };
})();

const Odd = (() => {
  // console.log("Odd once");

  unMount(() => {
    console.log("cb for Odd");
  });

  return (props) => {
    console.log(props);
    return "Odd render";
  };
})();

const App = (() => {
  // console.log("App once");

  unMount(() => {
    console.log("cb for App");
  });

  return (props) => {
    console.log(props.p);
    return ["App render ", caller(props.fn, props.param)];
  };
})();

function caller(fn, rest) {
  // console.log("here we need which unmount to be called");

  return fn(rest);
}

// for simple

// console.log(caller(App));

// console.log(caller(App, { p: "app props", fn: Even, param: "even props" }));

// console.log(hold);

// hard reset

// hold = [];

// console.log(caller(App, { p: "app props", fn: Odd, param: "odd props" }));

console.log(hold);

// for complex

for (let i = 0; i < 3; ++i) {
  if (i % 2 === 0) {
    console.log(caller(App, { p: "app props", fn: Even, param: "even props" }));
  } else {
    console.log(caller(App, { p: "app props", fn: Odd, param: "odd props" }));
  }
}
