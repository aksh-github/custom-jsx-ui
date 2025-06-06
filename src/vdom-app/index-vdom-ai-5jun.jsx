import MyUILib, {
  applyPatches,
  render,
  createStateManager,
  SimpleRouter,
} from "../utils/vdom/vdom-ai"; // Assuming MyUILib.js is in the same directory

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
  // let counter() = 0; // Simulate state
  const [counter, counterInst] = createStateManager(0);
  let showBox = true; // Simulate state
  let pref, ulref, inputref; // Placeholder for ref, not used in this example

  const handleClick = () => {
    console.log("Button clicked!");
    counterInst.set(counter() + 1); // Increment the counter
    // Apply patches to update the counter() display
    applyPatches([
      {
        op: "CONTENT",
        p: pref,
        c: `Counter: ${counter()}`,
      },
    ]);
  };

  const Box = (
    <div
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

  const toggleBox = () => {
    if (showBox) {
      // ulref.parentNode.insertBefore(Box, ulref);
      // Insert the box before the ulref element
      MyUILib.applyPatches([
        {
          op: "INSERT_BEFORE",
          p: ulref.parentNode,
          c: Box,
          ref: ulref,
        },
      ]);
    } else {
      // Remove the box if it exists
      const box = ulref.previousSibling;
      if (box) {
        MyUILib.applyPatches([
          {
            op: "REMOVE",
            p: ulref.parentNode,
            c: box,
          },
        ]);
      }
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
        pref = ulref = inputref = null; // Clear the reference
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

      <GreetMessage
        name={props.appName || "Initial User"}
        showEmoji={counter() % 2 === 0}
      />
      <input
        ref={(el) => (inputref = el)}
        type="text"
        placeholder="Type something..."
        onInput={(e) => {
          // Update the input value in the state manager
          inputref.value = e.target.value;
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
        Counter: {counter()}
      </p>
      <MyButton onClick={handleClick}>Increment Counter</MyButton>
      <br />
      <br />
      <MyButton onClick={toggleBox}>Toggle Box</MyButton>

      {/* Conditional rendering example */}

      <ul
        ref={(el) => {
          ulref = el;
        }}
      >
        <li>Item 1</li>
        <li>Item 2</li>
        {/* Example of adding/removing a child */}
        {counter() > 2 && <li>Item 3 (Added after 2 clicks)</li>}
        {counter() > 4 && <li>Item 4 (Added after 4 clicks)</li>}
      </ul>
      {/* Example of prop change */}
      {counter() % 3 === 0 && <p style={{ color: "red" }}>Divisible by 3!</p>}
      {counter() % 3 !== 0 && (
        <p style={{ color: "green" }}>Not divisible by 3!</p>
      )}
    </div>
  );
};

const About = () => {
  return (
    <div>
      <h2>About Page</h2>
      <a href="/" data-router-link>
        Back
      </a>
      <p>This is a simple about page for the app.</p>
    </div>
  );
};

// Get the root DOM element
const rootElement = document.getElementById("root");

// --- Router integration with render function ---
const routes = {
  "/": () => render(<App appName="Home" />, rootElement),
  "/about": () => render(<About />, rootElement),
  404: () => render(<h2>404 Not Found this...</h2>, rootElement),
};

const Router = new SimpleRouter(routes);
document.body.addEventListener("click", (e) => Router.linkHandler(e));
// Initial render (optional, router will handle on mount)
Router.mount(rootElement);
