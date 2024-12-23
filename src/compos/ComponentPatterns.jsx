import { createSignal } from "../utils/signal-complex";
import { signal } from "../utils/signal-v2";
import { state } from "../utils/simple-state";
import { h, onMount, onCleanup } from "../utils/vdom/vdom-lib";

export const DoesNotWork = (props) => {
  console.log("This does NOT work");
  return <p>{props.p}</p>;
};

export const PropsDriven = (props) => {
  //   console.log(props);
  return () => <div style={{ backgroundColor: "beige" }}>{props.n}</div>;
};

export const ArrayWithoutMap = () => {
  console.log("If you try to change the array it won't work");
  // let arr = [<p>10</p>, <p>20</p>];
  const [arr, set] = signal([<p>10</p>, <p>20</p>]);

  setTimeout(() => {
    console.log("exec");
    set([...arr(), <p>40</p>]);
    // set([arr().filter((_, idx) => idx !== 0)]);
    console.log(arr());
  }, 4000);

  return () => ["some str", ...arr(), 100000];
};

export const ArrayWithMap = () => {
  console.log("If you try to change the array it won't work");
  // let arr = [<p>10</p>, <p>20</p>];
  const [arr, set] = createSignal([<p>10</p>, <p>20</p>]);

  // this definitelys wont work
  setTimeout(() => {
    console.log("exec");
    set([...arr(), <Row key={2} n={<p>40</p>} />]);
    // set([arr().filter((_, idx) => idx !== 0)]);
    console.log(arr());
  }, 4000);

  const Row =
    () =>
    ({ n }) =>
      n;

  return () => (
    <div>
      {arr().map((el, idx) => {
        return <Row key={idx} n={el} />;
      })}
    </div>
  );
};

export const ArrayThatWorks = () => {
  //   console.log("This does work");
  console.log("This works as expected");
  //   const arr = [<li>10</li>, <li>20</li>];
  const Arr = state({ a: [<li>10</li>, <li>20</li>] });
  return () => (
    <div style={{ backgroundColor: "greenyellow" }}>
      <button
        onClick={() => {
          Arr.set({ a: [...Arr.get("a"), <li>40</li>] });
          console.log(Arr.get("a"));
        }}
      >
        Update below Array
      </button>
      <button
        onClick={() => {
          Arr.set({
            a: Arr.get("a").filter((el) => {
              return false;
            }),
          });
          console.log(Arr.get("a"));
        }}
      >
        Filter below Array
      </button>
      <ul>
        {Arr.get("a").map((el) => {
          return el;
        })}
      </ul>
    </div>
  );
};

export const ArrayWithFragments = () => {
  console.log("This works for only static, changes won't reflect");
  const arr = [<p>10</p>, <p>20</p>];
  return () => <>{arr}</>;
};
