import {
  h,
  createElement,
  addPatches,
  addPropsPatches,
  computed,
  ReactiveText,
  signal,
  effect,
} from "@dom-lib";

const [toDelete, setToDelete] = signal(null);

const Counter = (props) => {
  const [count, setCount] = signal(0);
  const style = computed(() => {
    return count() % 2 === 0
      ? {
          backgroundColor: "lightblue",
        }
      : { backgroundColor: "lightcoral" };
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
      }}
      style={style}
      onUnmount={() => {
        stopEffect?.();
        console.log("Unmounted", props.id);
      }}
    >
      <h3>{props.key}</h3>
      <ReactiveText
        type="p"
        elementProps={{}}
        value={count}
        textContent={(v) => `Counter: ${v}`}
      />
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

export const App = () => {
  const [ctr, setCtr] = signal(0);
  const OnMount = () => {
    console.log("App Mounted");
  };
  const [cls, setCls] = signal("red");
  const list = ["Counter 1", "Counter 2", "Counter 3"];
  setToDelete(`#${list[0].toLowerCase().replace(" ", "-")}`);

  // let $h1 = null;
  // effect(() => {
  //   const v = ctr();
  //   if ($h1) $h1.textContent = `My Counter App ${v}`;
  // });

  return (
    <div
      className={cls}
      onMount={OnMount}
      onUnmount={() => console.log("App Unmounted")}
    >
      {/* <h1 ref={(el) => ($h1 = el)}>My Counter App {ctr()}</h1> */}
      <ReactiveText
        type="h1"
        elementProps={{
          onMount: () => {
            console.log("ReactiveText mounted");
          },
        }}
        value={ctr}
        textContent={(val) => `My Counter App ${val}`}
      />

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
          Remove
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
