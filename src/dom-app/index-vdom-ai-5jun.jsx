import MyUILib, {
  applyPatches,
  render,
  SimpleRouter,
  applyPropsPatches,
  state,
} from "../utils/dom/dom-ai"; // Assuming MyUILib.js is in the same directory

import { atom, registerCallback } from "../utils/simple-state";

// Define a simple functional component
const GreetMessage = ({ name, showEmoji }) => {
  return (
    <p>
      Hello, {name}! {showEmoji && "👋"}
    </p>
  );
};

const MyButton = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px",
        backgroundColor: "lightblue",
        border: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
};

const App = (props) => {
  // Root component with some state-like behavior for demonstration
  // let counter = 11; // Simulate state
  const [counter, setCounter] = atom(0);
  // const [counter, counterInst] = createState(0);
  let showBox = true; // Simulate state
  let pref, ulref, inputref, pdivref, spn; // Placeholder for ref, not used in this example
  let boxInstance = null; // Placeholder for box instance

  console.log("App component rendered", counter());

  let timer = 0; // Placeholder for timer
  let intv = setInterval(() => {
    timer += 1; // Increment the timer
    // Apply patches to update the timer display
    applyPatches([
      {
        op: "CONTENT",
        p: spn, // Assuming spn is a reference to a span element
        c: `Timer: ${timer}`,
      },
    ]);
  }, 1000); // Update every second

  const box = () => (
    <div
      onMount={(el) => {
        // This will be called when the box is mounted
        console.log("Box component mounted:", el);
      }}
      onUnmount={(el) => {
        // This will be called when the box is unmounted
        console.log("Box component unmounted:", el);
        // Clear the reference if needed
      }}
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid blue",
        backgroundColor: "#e0e0ff",
      }}
    >
      <p>This box is conditionally rendered.</p>
      <small>Random number: {Math.random().toFixed(4)}</small>
    </div>
  );

  const handleClick = () => {
    console.log("Button clicked!");
    // counter += 1; // Increment the counter
    setCounter((counter) => counter + 1);
    // Apply patches to update the counter() display
    // applyPatches([
    //   {
    //     op: "CONTENT",
    //     p: pref,
    //     c: `Counter: ${counter}`,
    //   },
    //   {
    //     op: "CONTENT",
    //     p: pdivref,
    //     c: `Counter is ${counter % 2 === 0 ? "even" : "odd"}`,
    //   },
    // ]);

    // applyPropsPatches([
    //   {
    //     $target: pdivref,
    //     newProps: { style: { color: counter % 2 === 0 ? "blue" : "green" } },

    //     // oldProps: { style: { color: "blue" } },
    //   },
    // ]);
  };

  const toggleBox = () => {
    if (showBox) {
      // ulref.parentNode.insertBefore(Box, ulref);
      // Insert the box before the ulref element
      boxInstance = box(); // Create a new box instance
      MyUILib.applyPatches([
        {
          op: "INSERT_BEFORE",
          p: ulref.parentNode,
          c: boxInstance,
          ref: ulref,
        },
      ]);
    } else {
      // Remove the box if it exists
      // const box = ulref.previousSibling;

      MyUILib.applyPatches([
        {
          op: "REMOVE",
          p: ulref.parentNode,
          c: boxInstance, // Use the box instance to remove it
        },
      ]);
      boxInstance = null; // Clear the box instance reference
    }
    showBox = !showBox; // Toggle the state
  };

  return (
    <div
      className="app-container"
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        textAlign: "center",
      }}
      onMount={(el) => {
        // This will be called when the component is mounted
        console.log("App component mounted:", el);
      }}
      onUnmount={(el) => {
        // This will be called when the component is unmounted
        console.log("App component unmounted:", el);
        pref = ulref = inputref = pdivref = spn = null; // Clear the reference
        clearInterval(intv); // Clear the timer interval
        intv = null; // Clear the interval reference
      }}
    >
      <h1>My Custom UI App with Diffing</h1>
      <a href="/about" data-router-link>
        About
      </a>
      <button
        onClick={() => {
          // Navigate to the about page
          Router.navigate("/about");
        }}
      >
        Go to About
      </button>

      {/* <GreetMessage
        name={props.appName || "Initial User"}
        showEmoji={counter % 2 === 0}
      /> */}
      <input
        ref={(el) => (inputref = el)}
        type="text"
        placeholder="Type something..."
        onInput={(e) => {
          // Update the input value in the state manager

          // Apply patches to update the input value display
          MyUILib.applyPatches([
            {
              op: "CONTENT",
              p: inputref.nextSibling, // Assuming the next sibling is where we want to display the value
              c: e.target.value,
            },
          ]);
        }}
      />
      <p></p>
      <p
        ref={(el) => {
          pref = el;
        }}
      >
        Counter is: {counter()}
      </p>
      <MyButton key={"increment"} onClick={handleClick}>
        Increment Counter
      </MyButton>
      <br />
      <br />
      <MyButton key={"toggleBox"} onClick={toggleBox}>
        Toggle Box
      </MyButton>

      {/* Conditional rendering example */}

      <ul
        ref={(el) => {
          ulref = el;
        }}
      >
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      {/* Example of prop change */}
      {/* {counter % 3 === 0 && <p style={{ color: "red" }}>Divisible by 3!</p>}
      {counter % 3 !== 0 && (
        <p style={{ color: "green" }}>Not divisible by 3!</p>
      )} */}
      <p
        style={{ color: counter % 2 === 0 ? "blue" : "green" }}
        ref={(el) => {
          pdivref = el;
          // applyPropsPatches([
          //   {
          //     $target: pdivref,
          //     newProps: {},
          //   },
          // ]);
        }}
      >
        Counter is {counter % 2 === 0 ? "even" : "odd"}
      </p>
      <>
        Some fragment content here.{" "}
        <span ref={(el) => (spn = el)}>{timer}</span>
      </>
    </div>
  );
};

const About = () => {
  return (
    <>
      <h2
        onMount={() => {
          console.log("About component mounted");
        }}
        onUnmount={() => {
          console.log("About component unmounted");
        }}
      >
        About Page
      </h2>
      <a href="/" data-router-link>
        Back
      </a>
      <p>This is the About page of the app.</p>
      <p>Welcome to the About section!</p>
      <p>Here you can find more information about this application.</p>
      <p>This is a simple about page for the app.</p>
    </>
  );
};

const Even = () => {
  const [count, setCount] = state(0);

  return (
    <div>
      <h2>Even Component</h2>
      <p>
        This is the Even component.
        {count + 2}
      </p>
      <button onClick={() => setCount((count) => count + 2)}>Increment</button>
    </div>
  );
};

const Odd = () => {
  const [count, setCount] = state(0);
  return (
    <div>
      <h2>Odd Component</h2>
      <p>
        This is the Odd component.
        {count + 1}
      </p>
      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
    </div>
  );
};

const Counter = () => {
  const [name, setName] = state("abc");
  const [count, setCount] = state(10);

  return (
    <div>
      <h2>
        Counter: {count} {name}
      </h2>
      {/* <button onClick={() => setCount((count) => count + 1)}>Increment</button> */}
      <button
        onClick={() => {
          setCount((count) => count + 1);
          setName("xyz");
        }}
      >
        Increment
      </button>
      <hr />
      {count % 2 === 0 ? <Even /> : <Odd />}
    </div>
  );
};

// Get the root DOM element
const rootElement = document.getElementById("root");

// --- Router integration with render function ---
const routes = {
  "/": () => render(<Counter />, rootElement),
  "/about": () => render(<About />, rootElement),
  404: () => render(<h2>404 Not Found this...</h2>, rootElement),
};

const Router = new SimpleRouter(routes);
document.body.addEventListener("click", (e) => Router.linkHandler(e));
// Initial render (optional, router will handle on mount)
Router.mount(rootElement);

// let ctr = 0;
// const iv = setInterval(() => {
//   // <Counter />;
//   // console.log(<Counter />);
//   render(<Counter />, rootElement);

//   if (ctr < 1) {
//     ctr++;
//   } else {
//     clearInterval(iv);
//   }
// }, 2500);

document.body.addEventListener("click", (e) => {
  render(<Counter />, rootElement);
});

// registerCallback(() => {
//   // render(<App />, rootElement);
//   <Counter />;
// });
