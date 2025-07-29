import { createEffect, createState } from "../utils/simple-state";
import { memo } from "../utils/vdom/memo";
import { createElement, h } from "../utils/vdom/vdom-lib";
// import "./App.css";

const PixelComp = memo(({ largeArray }) => {
  return largeArray.map((value) => (
    <div
      //   key={value}
      className="w-2 h-2 bg-neutral-700"
      style={{
        backgroundColor: `rgb(${value % 255}, ${(value * 2) % 255}, ${
          (value * 3) % 255
        })`,
        width: "10px",
        height: "10px",
      }}
    ></div>
  ));
});

function SlowComponent(props) {
  const [largeArray, setLargeArray] = createState([]);
  const [ignore, setIgnore] = createState(false);

  // createEffect(() => {
  //   console.log("updating SlowComponent");
  //   setTimeout(() => {
  //     setIgnore(true);
  //   }, 1000);
  // }, [largeArray]);

  createEffect(() => {
    console.log("mounting SlowComponent");
    // largeArray = Array.from({ length: 10000 }, (_, i) => i);
    setLargeArray(Array.from({ length: 10000 }, (_, i) => i));

    return () => {
      console.log("unmounting SlowComponent");
      largeArray.length = 0;
      setLargeArray([]);
    };
  }, []);

  return (
    <div
      //   className="flex flex-wrap overflow-scroll gap-1"
      style={{
        display: "flex",
        flexWrap: "wrap",
        // overflow: "scroll",
        gap: "1px",
      }}
      ignoreNode2={ignore}
    >
      <PixelComp largeArray={largeArray} />
      {/* {largeArray.map((value) => (
        <div
          //   key={value}
          className="w-2 h-2 bg-neutral-700"
          style={{
            backgroundColor: `rgb(${value % 255}, ${(value * 2) % 255}, ${
              (value * 3) % 255
            })`,
            width: "10px",
            height: "10px",
          }}
        ></div>
      ))} */}
    </div>
  );
}

function CounterButton(props) {
  return <button onClick={props.onClick}>Increase count</button>;
}

function ColorPicker(props) {
  return (
    <input
      type="color"
      value={props.value}
      // onChange={(e) => props.onChange(e.target.value)}
      onInput={(e) => props.onChange(e.target.value)}
      className="w-full h-12 cursor-pointer rounded border border-white/20 bg-neutral-700 p-1"
    />
  );
}

function DemoComponent(props) {
  const [count, setCount] = createState(0);
  const [color, setColor] = createState("#ffffff");

  return (
    <div className={`flex gap-8`}>
      <div className="flex flex-col p-4 border border-white h-64 w-96 gap-4">
        <h2 className="text-xl font-bold mb-8 text-center">Color Picker</h2>
        <div className="mt-2">
          Current value: <br />
          <span className="font-mono">{color}</span>
        </div>
        <ColorPicker value={color} onChange={(e) => setColor(e)} />
      </div>
      <div className="flex flex-col p-4 border border-white h-64 w-96 gap-4">
        <h2 className="text-xl font-bold mb-8 text-center">Counter</h2>
        <CounterButton onClick={() => setCount((count) => count + 1)} />
        <div className="mt-2">
          Current value: <br />
          <span className="font-mono">{count}</span>
        </div>
      </div>
      <div className="flex flex-col p-4 border border-white h-64 w-96 gap-2">
        <h2 className="text-xl font-bold text-center">A Slow Component</h2>
        <span className="text-center text-neutral-200 font-light">
          (This component renders 10,000 boxes)
        </span>
        <SlowComponent unused={{ name: "nope" }} />
      </div>
    </div>
  );
}

function Dnd() {
  let card = null;

  createEffect(() => {
    // draw();
    let newX = 0,
      newY = 0,
      startX = 0,
      startY = 0;
    // card.addEventListener("mousedown", mouseDown);

    function mouseDown(e) {
      startX = e.clientX;
      startY = e.clientY;

      // document.addEventListener("mousemove", mouseMove);
      // document.addEventListener("mouseup", mouseUp);
    }

    function mouseMove(e) {
      newX = startX - e.clientX;
      newY = startY - e.clientY;

      startX = e.clientX;
      startY = e.clientY;

      card.style.top = card.offsetTop - newY + "px";
      card.style.left = card.offsetLeft - newX + "px";
    }

    function mouseUp(e) {
      document.removeEventListener("mousemove", mouseMove);
    }

    return () => {
      card = null;
    };
  }, []);

  return (
    <div
      id="container"
      style={{ width: "500px", height: "500px", background: "coral" }}
    >
      <div
        ref={(_c) => {
          card = _c;
          _c = null;
        }}
        id="card"
        style={{
          border: "1px dotted black",
          width: "100px",
          height: "100px",
          position: "relative",
        }}
      ></div>
    </div>
  );
}

function Heavy() {
  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="text-2xl font-bold text-center py-8 absolute top-0 left-0 right-0">
        Heavy Component? Demo
      </h1>
      <div className={`flex items-center justify-center flex-grow`}>
        <DemoComponent />
      </div>
      <Dnd />
    </div>
  );
}

export default Heavy;
