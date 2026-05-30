import { h, createElement, addPatches, addPropsPatches } from "@dom-lib";
import { signal, effect } from "@simple-signal";

const [toDelete, setToDelete] = signal(null);

const Counter = (props) => {
  let [count, setCount] = signal(0);
  let [style, setStyle] = signal({ backgroundColor: "lightblue" });
  let $p = null,
    $div = null;

  effect(() => {
    console.log("Effect ran for", props.id);
    const v = count();
    if ($p) {
      $p.textContent = `Counter: ${v}`;
    }

    setStyle({
      backgroundColor: v % 2 === 0 ? "lightblue" : "lightcoral",
    });

    if ($div) {
      // $div.style.backgroundColor = v % 2 === 0 ? "lightblue" : "lightcoral";
      addPropsPatches([
        {
          $target: $div,
          newProps: {
            style:
              v % 2 === 0
                ? { backgroundColor: "lightblue" }
                : { backgroundColor: "lightcoral" },
          },
          oldProps: $div.style,
        },
      ]);
    }
  });

  const stopEffect = effect(() => {
    // subscribe to parent counter for demo
    const v = props.ctr();
    console.log("Counter component effect ran for", v);
  });

  return (
    <div
      id={props.id}
      onMount={(el) => {
        console.log("Mounted", props.id);
        $div = el;
      }}
      style={style()}
      onUnmount={() => {
        stopEffect();
        $div = $p = null;
        console.log("Unmounted", props.id);
      }}
    >
      <p ref={(el) => ($p = el)}>Counter: {count()}</p>
      <button
        onClick={() => {
          // Increment counter logic here
          setCount((prev) => prev + 1);
        }}
      >
        Increment
      </button>
    </div>
  );
};

const App = () => {
  const [ctr, setCtr] = signal(0);
  const OnMount = () => {
    console.log("App Mounted");
  };
  const [cls, setCls] = signal("red");
  const list = ["Counter 1", "Counter 2", "Counter 3"];
  setToDelete(`#${list[0].toLowerCase().replace(" ", "-")}`);

  let $h1 = null;
  effect(() => {
    const v = ctr();
    if ($h1) $h1.textContent = `My Counter App ${v}`;
  });

  return (
    <div
      className={cls}
      onMount={OnMount}
      onUnmount={() => console.log("App Unmounted")}
    >
      <h1 ref={(el) => ($h1 = el)}>My Counter App {ctr()}</h1>
      <button
        onClick={() => {
          setCtr((prev) => prev + 1);
          setCls((prev) => (prev === "red" ? "green" : "red"));
        }}
      >
        Toggle Class
      </button>
      <p>
        <button
          onClick={() => {
            const el = document.querySelector(toDelete());
            if (el)
              addPatches([
                {
                  op: "REMOVE",
                  p: el.parentNode,
                  c: el,
                },
              ]);
          }}
        >
          Some
        </button>
      </p>
      {list.map((item) => (
        <Counter
          key={item}
          id={`${item.toLowerCase().replace(" ", "-")}`}
          ctr={ctr}
        />
      ))}
    </div>
  );
};

// addPatches([
//   {
//     op: "ADD",
//     c: <App />,
//     index: 0,
//     p: document.getElementById("root"),
//   },
// ]);

document.getElementById("root").appendChild(createElement(<App />));

// addPatches([
//   {
//     op: "ADD",
//     c: <Counter />,
//     index: 0,
//     p: document.getElementById("root"),
//   },

//   {
//     op: "ADD",
//     c: <Counter />,
//     index: 1,
//     p: document.getElementById("root"),
//   },
// ]);
