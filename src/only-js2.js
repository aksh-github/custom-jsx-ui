// state lib

// Simulate React state

// let state = [];
// let setters = [];
// let currentIndex = 0;

// function render() {
//   currentIndex = 0;
//   // Simulate re-rendering the component
//   console.log("currentIndex reset");
// }

// function createState(initialValue) {
//   const index = currentIndex;

//   if (state[index] === undefined) {
//     state[index] = initialValue;
//   }

//   const setState = (newValue) => {
//     state[index] =
//       typeof newValue === "function" ? newValue(state[index]) : newValue;
//   };

//   setters[index] = setState;
//   currentIndex++;

//   return [state[index], setState];
// }

// // Usage

// function Odd() {
//   const [count, setCount] = createState(1);

//   console.log(`Odd: ${count}`);
//   setCount(count + 2);
// }

// function Even() {
//   const [count, setCount] = createState(0);

//   console.log(`Even: ${count}`);
//   setCount(count + 2);
// }

// function Counter() {
//   const [count, setCount] = createState(0);
//   const [s, setS] = createState("akshay");

//   // const increment = () => setCount(count + 1);
//   setCount(count + 1);
//   setS("bapaye");

//   console.log(count, s);

//   if (count % 2 === 0) {
//     Even();
//   } else {
//     Odd();
//   }
// }

// // Simulate React rendering
// Counter();
// // after this we need to call render()
// render();
// Counter();
// // after this we need to call render()
// render();
// Counter();

// Odd();
// Odd();

// a variation to react state based on key

const gs = {};

const state = (_key, iv) => {
  const key = _key;
  let st = gs[key] || iv;

  if (gs[key] == undefined) gs[key] = st;

  const get = () => {
    return st;
  };

  const set = (nv) => {
    gs[key] = nv;
  };

  return [gs[key], set];
};

// function C() {
//   const [c, sc] = state("C", 0);

//   sc(c + 1);

//   console.log(c);
// }

// C();
// C();
// C();

function Odd() {
  const [count, setCount] = state("Odd0", 1);

  console.log(`Odd: ${count}`);
  setCount(count + 2);
}

function Even() {
  const [count, setCount] = state("Even0", 0);

  console.log(`Even: ${count}`);
  setCount(count + 2);
}

function Comp() {
  const [c, setc] = state("Comp0", 0);
  const [s, sets] = state("Comp1", "akshay");
  // console.log(c)
  setc(c + 1);
  sets("bapaye");

  console.log(c, s);

  if (c % 2 === 0) {
    Even();
  } else {
    Odd();
  }
}

Comp();
Comp();
Comp();
Comp();

console.log(gs);
