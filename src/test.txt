import {
  atom,
  state,
  registerCallback,
  skipUpdate,
} from "./utils/simple-state";
import {
  renderUtils,
  onMount,
  onCleanup,
  domv2,
  applyPatchv2,
  microPatch,
  getPath,
  computeDiff,
} from "./utils/dom/lib.v2";

// -------------------------------

registerCallback(() => {
  renderUtils.forceUpdate();
});

const Child = () => {
  const cpair = atom(0);
  let ref = null;

  return () => {
    return (
      <div ref={(el) => (ref = el)}>
        Child {cpair[0]()}
        <button
          onClick={() => {
            // cpair[1](cpair[0] => cpair[0]() + 1);
            skipUpdate(true);
            cpair[1](cpair[0]() + 1);
            microPatch("Child", ref);
            console.log(ref);
            skipUpdate(false);
          }}
        >
          Increment
        </button>
      </div>
    );
  };
};

const Timer = () => {
  const tpair = atom(0);
  let keeper;

  onMount(() => {
    keeper = setInterval(() => {
      if (tpair[0]() > 10) {
        clearInterval(keeper);
        return;
      }
      tpair[1](tpair[0]() + 1);
    }, 1000);
  });

  onCleanup(() => {
    clearInterval(keeper);
  });

  return () => <div>Child {tpair[0]()}</div>;
};

const AppTemp = () => {
  const [data, setData] = state({
    txt: "some existing",
    ref: null,
    ctr: 0,
    oldRef: null,
    arr: [],
  });

  onMount(() => {
    console.log("rendered AppTemp");

    setTimeout(() => {
      console.log(
        computeDiff(
          document.querySelector("button"),
          document.querySelectorAll("button")[1]
        )
      );
    }, 4000);
  });

  return () => {
    return (
      <div>
        <h1>Static Text</h1>
        {/* <Child /> */}
        <span>{data().txt}</span>
        <input
          type="text"
          value={data().txt}
          onInput={(e) => {
            // data.txt = e.target.value;
            setData({ ...data(), txt: e.target.value });
          }}
        />
        <p>
          <Timer />
        </p>
        <p>
          <Timer />
        </p>
        <button
          onClick={() => {
            skipUpdate(() => {
              // update data
              setData((_data) => ({
                ..._data,
                ctr: _data.ctr + 1,
              }));

              // update dom
              const path = getPath(
                document.getElementById("apply"),
                document.querySelector("#apply button ")
              );
              path.push(1);
              console.log(path);
              applyPatchv2(document.getElementById("apply"), [
                {
                  type: "TEXT",
                  path,
                  value: data().ctr,
                },
              ]);
            });
          }}
        >
          Click {data().ctr}
        </button>
        <button>Click 1</button>
        {/* <h3>{pst() % 2 === 0 ? <Even /> : <Odd />}</h3> */}
      </div>
    );
  };
};

// console.log(<AppTemp />);
const Even = () => {
  // onMount(() => {
  //   console.log("onMount for Even");
  // });

  // onCleanup(() => {
  //   console.log("unmount for Even");
  // });

  return () => "Divisible by 2";
};

const root = document.getElementById("apply");

renderUtils.render(root, () => () => <AppTemp />);

// renderUtils.render(root, () => () => 9.888);
