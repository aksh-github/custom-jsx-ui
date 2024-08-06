import { createSignal, batch, createEffect } from "../utils/signal-complex";
import {
  h,
  onMount,
  onCleanup,
  updateSingle,
  forceUpdate,
} from "../utils/vdom/vdom-lib";
// import { dom, onMount, onCleanup } from "lib-jsx";
// import Link from "./compos/Link";
import { navigoRouter, NavigoWrapper } from "../utils/navigo-router";
import state from "../utils/simple-state";
import Link from "../compos/Link";
import {
  ArrayWithMap,
  ArrayWithoutMap,
  ArrayThatWorks,
  ArrayWithFragments,
  PropsDriven,
} from "../compos/ComponentPatterns";
import { SimpleSwitch } from "../compos/Switch";
import { signal } from "../utils/signal-v2";
// import { useState } from "./utils/hooks-experi";

// Ctr

const Ctr = ({ v, __spl }) => {
  const st = state({ c: 100, version: "Loading..." });

  onCleanup(() => {
    console.log("unmount Ctr");
  });

  onMount(() => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      fetch("/package.json")
        .then((res) => res.json())
        .then((res) => {
          st.set({
            version: res.version,
          });
        });
    }, 4000);
  });

  return (props) => {
    // console.log(props);
    return (
      <div
        style={{
          background: st.get("c") % 2 === 0 ? "orange" : "tomato",
          color: st.get("c") % 2 === 0 ? "white" : "unset",
          padding: "2em",
        }}
      >
        <h3>Child</h3>
        <p>
          Parent ctr: {props.v} {props.v % 2 === 0 ? "Even" : null}
        </p>
        <p>My ctr: {st.get("c")}</p>
        <p>Json Value: {st.get("version")}</p>
        <button
          onClick={(e) => {
            // setcc(cc() + 1);
            st.set({ c: st.get("c") + 1 });
          }}
        >
          click
        </button>
      </div>
    );
  };
};

// end Ctr

const Input = () => {
  const input = state({
    input: {
      v: "some",
      e: "",
    },
  });

  onCleanup(() => {
    console.log("unmount Input");
  });

  return () => {
    return (
      <div>
        {[10, 20, 30].map((it) => {
          return <p>{it}</p>;
        })}
        <input
          className="input"
          onInput={(e) => {
            // console.log(e, e.target.value);
            input.set({
              input: {
                v: e.target.value,
                e: e.target.value ? "" : "incorrect",
              },
            });
          }}
          value={input.get("input").v}
        />
        <p>{input.get("input").e}</p>
        <TextArea />
      </div>
    );
  };
};

// ComplexRoute (route 1)

function ComplexRoute(props) {
  console.log("rendered App", props);
  const [c, setc] = createSignal(0);
  const [s, sets] = createSignal("akshay");
  let ref = null;

  createEffect(() => {
    console.log(c());
  });

  onMount(() => {
    console.log("mount app", ref);
  });

  const arr = [];
  for (let i = 0; i < 2; ++i) arr.push(i);

  const Number = () => {
    onMount(() => {
      console.log("mounting number");
    });
    onCleanup(() => {
      console.log("unmounting number");
    });
    return ({ n }) => <li>{n}</li>;
  };

  const Master = () => () =>
    (
      <div>
        <Ctr v={c()} />
        <Input />
      </div>
    );

  return () => (
    <div
      ref={(_r) => {
        // console.log(_r);
        ref = _r;
      }}
    >
      hello world {c()} {s()}
      <div>
        <button
          onClick={(e) => {
            batch(() => {
              setc(c() + 1);
              sets("akshay is smart");
            });
          }}
        >
          Counter
        </button>
      </div>
      {/* {c() % 2 === 0 ? <Master /> : "NA"}
      {c() % 2 === 0 ? <Master /> : "NA"} */}
      {c() % 2 !== 0 ? (
        <ul>
          {arr.map((n) => (
            <Number n={n} />
          ))}
        </ul>
      ) : // <Number n={10} />
      null}
      <p>
        <Link href="route2">Go next</Link>
        <button
          onClick={() => {
            navigoRouter.get().navigate("route2");
          }}
        >
          Go to simple
        </button>
      </p>
      <Ctr v={c()} key={"k1"} />
      {c() % 2 === 0 ? <Master /> : "NA"}
      {/* {c() % 2 === 0 ? <Master /> : "NA"} */}
    </div>
  );
}

// SimpleRoute (route 2)

// const pst = state({ r: 0 });

const Even = () => {
  onMount(() => {
    console.log("onMount for Even");
  });

  onCleanup(() => {
    console.log("unmount for Even");
  });

  return () => "Divisible by 2";
};

const SomeOdd = () => {
  onMount(() => {
    console.log("onMount for SomeOdd");
  });

  onCleanup(() => {
    console.log("unmount for SomeOdd");
  });

  return () => "[SomeOdd]";
};

const Odd = () => {
  onMount(() => {
    console.log("onMount for Odd");
  });

  onCleanup(() => {
    console.log("unmount for Odd");
  });

  return () => (
    <div>
      <SomeOdd />
      NOT divisible
    </div>
  );
};

// SimpleRoute

export const SimpleRoute = () => {
  const [r, setr] = createSignal(0);
  const pst = state({ r: 0 });
  // const tv = pst.get("r");
  let ref = null;

  const arrState = state({ arr: ["10", "20"] });

  onMount(() => {
    console.log("Ref available in onMount for SimpleRoute", ref);
  });

  onCleanup(() => {
    console.log("unmount for SimpleRoute");
  });

  const NoParentComp = () => {
    // let noParent = [<p>10</p>, <p>20</p>];
    const [noParent, setNoParent] = createSignal([<p>10</p>, <p>20</p>]);
    // const Arr = state({ a: [<p>10</p>, <p>20</p>] });
    console.log("This is not supported, since h() return value is cached");

    return () => (
      <>
        <button
          onClick={() => {
            setNoParent([...noParent(), <p>40</p>]);
            console.log(noParent());
            // Arr.set({ a: [...Arr.get("a"), <p>40</p>] });
            // console.log(Arr.get("a"));
          }}
        >
          Update below Array (NOT supported)
        </button>
        {noParent()}
      </>
    );
  };

  return () => {
    console.log(pst.get("r"));
    return (
      <div ref={(_ref) => (ref = _ref)}>
        {/* route2
        <Link href="/">Go Back</Link>
        <hr /> */}
        <div>
          <h3>{pst.get("r") % 2 === 0 ? <Even /> : <Odd />}</h3>
          <button onClick={() => pst.set({ r: pst.get("r") + 1 })}>
            Change
          </button>
        </div>
        {/* <ArrayWithMap /> */}
        {/* <ArrayWithoutMap /> */}
        {/* <ArrayThatWorks /> */}
        {/* <ArrayWithFragments /> */}
        {/* <PropsDriven n="Property to Component" /> */}
        <TextArea />
      </div>
    );
  };
};

export const TextArea = () => {
  const [txt, settxt] = createSignal("");
  const [t, set] = signal("");
  let txtRef;

  console.log("came here");

  const clear = () => {
    set("");
    settxt("");
  };

  // createEffect(() => {
  //   t();
  //   // below code doesn't work properly
  //   if (txtRef) updateSingle(txtRef);
  // });

  return () => (
    <div ref={(ta) => (txtRef = ta)} style={{ backgroundColor: "beige" }}>
      <button onClick={clear}>Clear</button>
      {/* <br />
      <span>{txt()}</span>
      <textarea
        value={txt()}
        onInput={(e) => settxt(e.target.value)}
      ></textarea>
      <br /> */}
      <span>{t()}</span>
      <input value={t()} onInput={(e) => set(e.target.value)} />
    </div>
  );
};

export function App(props) {
  // let  = "Loading..."
  let curPath = "null";
  // const [path, setPath] = signal(curPath);
  const routeSt = state({ path: null });

  const setupRoute = () =>
    navigoRouter.set(
      {
        // errorComponent: Error,
        // basePath: window.location.pathname,
        routes: [
          {
            path: "route2",
            // component: A,
          },
          {
            path: "/",
            // component: B,
          },
          {
            path: "*",
            // component: () => <div>Wrong url</div>,
          },
        ],
      },
      (Compo, match) => {
        console.log(Compo, match);
        // routeSt.set({ path: match?.url });
        if (curPath != match?.url) {
          curPath = match.url;
          // setPath(match.url);
          routeSt.set({ path: match?.url });
        }
        // console.log(path());
      }
    );

  onMount(() => {
    console.log("=== Main App mounted");
    setupRoute();
  });
  return () =>
    // <div>
    // ({
    //   <SimpleSwitch cond={routeSt.get("path")}>
    //     <SimpleSwitch.Case render={"Wrong path 404"} />
    //     <SimpleSwitch.Case when={"route2"} render={<SimpleRoute />} />
    //     <SimpleSwitch.Case when={""} render={<ComplexRoute />} />
    //   </SimpleSwitch>
    // })
    // </div>

    (() => {
      switch (routeSt.get("path")) {
        case "route2":
          return <SimpleRoute />;
        case "":
          return <ComplexRoute />;
        default:
          return "Wrong path 404";
      }
    })();
}
