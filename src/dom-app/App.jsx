import { createSignal, batch, createEffect } from "../utils/signal-complex";
import { domv2, onMount, onCleanup } from "../utils/dom/lib.v2";
// import { dom, onMount, onCleanup } from "lib-jsx";
// import Link from "../compos/Link";
import { state, atom } from "../utils/simple-state";
import { signal } from "../utils/signal-v2";
// import { useState } from "./utils/hooks-experi";
import { LinkV2, Router } from "../utils/router-v2";

let routeHandler = Router();

const Ctr = ({ v, __spl }) => {
  const [st, setSt] = state({ c: 100, version: "Loading..." });

  onCleanup(() => {
    console.log("unmount Ctr");
  });

  onMount(() => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      fetch("/package.json")
        .then((res) => res.json())
        .then((res) => {
          setSt((st) => ({
            ...st,
            version: res.version,
          }));
        });
    }, 4000);
  });

  return (props) => {
    // console.log(props);
    return (
      <div
        style={{
          background: st().c % 2 === 0 ? "orange" : "tomato",
          color: st().c % 2 === 0 ? "white" : "unset",
          padding: "2em",
        }}
      >
        <h3>Child</h3>
        <p>
          Parent ctr: {props.v} {props.v % 2 === 0 ? "Even" : null}
        </p>
        <p>My ctr: {st().c}</p>
        <p>Json Value: {st().version}</p>
        <button
          onClick={(e) => {
            // setcc(cc() + 1);
            setSt((st) => ({ ...st, c: st.c + 1 }));
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
  const [input, setInput] = state({
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
            setInput((st) => ({
              ...st,
              input: {
                v: e.target.value,
                e: e.target.value ? "" : "incorrect",
              },
            }));
          }}
          value={input().input.v}
        />
        <p>{input().input.e}</p>
        <TextArea />
      </div>
    );
  };
};

// ComplexRoute (route 1)

function ComplexRoute(props) {
  console.log("rendered App", props);
  const [c, setc] = atom(0);
  const [s, sets] = atom("akshay");
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
            // batch(() => {
            //   setc(c() + 1);
            //   sets("akshay is smart");
            // });
            setc(c() + 1);
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
        <LinkV2 href="route2">Go next</LinkV2>
        <button
          onClick={() => {
            routeHandler.navigator.go("route2");
          }}
        >
          Go to simple
        </button>
      </p>
      <Ctr v={c()} key={"k1"} />
      {c() % 2 === 0 ? <Master /> : "NA"}
    </div>
  );
}

// SimpleRoute (route 2)

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
  const [pst, setPst] = atom(0);
  // const tv = pst().r;
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

  const arr = [];
  for (let i = 0; i < 5000; ++i) arr.push(i);

  const Number = () => {
    onMount(() => {
      // console.log("mounting number");
    });
    onCleanup(() => {
      // console.log("unmounting number");
    });
    return ({ n }) => <li className="list-item">{n}</li>;
  };

  return () => {
    console.log(pst());
    return (
      <div ref={(_ref) => (ref = _ref)}>
        {/* route2
        <Link href="/">Go Back</Link>
        <hr /> */}
        <div>
          <h3>{pst() % 2 === 0 ? <Even /> : <Odd />}</h3>
          <button onClick={() => setPst(pst() + 1)}>Change</button>
        </div>
        {/* <ArrayWithMap /> */}
        {/* <ArrayWithoutMap /> */}
        {/* <ArrayThatWorks /> */}
        {/* <ArrayWithFragments /> */}
        {/* <PropsDriven n="Property to Component" /> */}

        {pst() % 2 === 0 ? (
          <ul>
            {arr.map((n) => (
              <Number n={n} />
            ))}
          </ul>
        ) : null}

        <TextArea />
      </div>
    );
  };
};

export const TextArea = () => {
  const [txt, settxt] = atom("");
  const [t, set] = atom("dfd");
  let txtRef;

  console.log("came here");

  const clear = () => {
    set("");
    settxt("");
  };

  return () => (
    <div ref={(ta) => (txtRef = ta)} style={{ backgroundColor: "beige" }}>
      <button onClick={clear}>Clear</button>
      <br />
      <span>{txt()}</span>
      <textarea
        value={txt()}
        onInput={(e) => settxt(e.target.value)}
      ></textarea>
      <br />
      <span>{t()}</span>
      <input value={t()} onInput={(e) => set(e.target.value)} />
    </div>
  );
};

export function App(props) {
  const [curPath, setCurPath] = state({ url: window.location.pathname });

  onMount(() => {
    console.log("=== Main App mounted");
    routeHandler.init(onRouteChange);
  });

  onCleanup(() => {
    routeHandler.cleanup();
  });

  function onRouteChange(path) {
    setCurPath(path);
  }
  return () => {
    return (
      <div>
        {/* <ul>
          <li>
            <LinkV2 to="/">Complex</LinkV2>
          </li>
          <li>
            <LinkV2 to="/route2">Simple</LinkV2>
          </li>
          <li>
            <LinkV2 to="/topics">Topics</LinkV2>
          </li>
          <li>
            <LinkV2 to="/frag">Fragments</LinkV2>
          </li>
        </ul> */}

        <hr />

        {(() => {
          switch (curPath().url) {
            // switch (route()) {
            case "/route2":
              return <SimpleRoute />;
            case "/":
              return <ComplexRoute />;
            case "/frag":
              return (
                <df>
                  {/* <ArrayWithFragmentsComplex />
                  <p>in between</p> */}
                  <ArrayWithFragments />
                </df>
              );
            default:
              if (curPath()?.url?.startsWith("/topics"))
                return <Topics basepath="/topics" match={curPath()} />;
              else return "Wrong path 404";
          }
        })()}
        <footer>some footer for all</footer>
      </div>
    );
    // return <SimpleRoute />;
  };
}
