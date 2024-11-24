import { createSignal, batch, createEffect } from "../utils/signal-complex";
import { h, onMount, onCleanup, Suspense, df } from "../utils/vdom/vdom-lib";
// import { dom, onMount, onCleanup } from "lib-jsx";
// import Link from "./compos/Link";

import { state, atom } from "../utils/simple-state";
import { LinkV2, Router } from "../utils/router-v2";

import {
  ArrayWithMap,
  ArrayWithoutMap,
  ArrayThatWorks,
  ArrayWithFragments,
  ArrayWithFragmentsComplex,
  // PropsDriven,
} from "../compos/ComponentPatterns";
import { SimpleSwitch } from "../compos/Switch";
import { signal } from "../utils/signal-v2";

let routeHandler = Router();

const Topic =
  () =>
  ({ topicId }) =>
    <h3>{topicId}</h3>;

const Topics = (p) => {
  const items = [
    { name: "Props v. State", slug: "props-v-state" },
    { name: "Rendering with React", slug: "rendering" },
    { name: "Components", slug: "components" },
  ];
  // console.log(p);

  return (props) => {
    // console.log(curPath.get());
    const { basepath, match } = props;

    const item = items.find(({ name, slug }) => {
      return match?.url?.endsWith(slug);
    });

    console.log(item);

    return (
      <div>
        <h2>Topics</h2>
        <ul>
          {items.map(({ name, slug }) => (
            <li key={name}>
              <LinkV2 to={`${basepath}/${slug}`}>{name}</LinkV2>
            </li>
          ))}
        </ul>
        {/* {items.map(({ name, slug }) => (
          <Route
            key={name}
            path={`${match.path}/${slug}`}
            render={() => <Topic topicId={name} />}
          />
        ))}
        <Route
          exact
          path={match.url}
          render={() => <h3>Please select a topic.</h3>}
        /> */}

        <Topic topicId={(item?.name || "") + " on " + match.url} />
      </div>
    );
  };
};

// Ctr

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
          setSt((prev) => ({
            ...prev,
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
          background: st("c") % 2 === 0 ? "orange" : "tomato",
          color: st("c") % 2 === 0 ? "white" : "unset",
          padding: "2em",
        }}
      >
        <h3>Child</h3>
        <p>
          Parent ctr: {props.v} {props.v % 2 === 0 ? "Even" : null}
        </p>
        <p>My ctr: {st("c")}</p>
        <p>Json Value: {st("version")}</p>
        <button
          onClick={(e) => {
            // setcc(cc() + 1);
            // setSt(()=>{ c: st("c") + 1 });
            setSt((prev) => ({
              ...prev,
              c: st("c") + 1,
            }));
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
    v: "some",
    e: "",
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
            setInput({
              v: e.target.value,
              e: e.target.value ? "" : "incorrect",
            });
          }}
          value={input("v")}
        />
        <p>{input("e")}</p>
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
  for (let i = 0; i < 1000; ++i) arr.push(i);

  const Number = () => {
    onMount(() => {
      // console.log("mounting number");
    });
    onCleanup(() => {
      // console.log("unmounting number");
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
        <ul style={{ minHeight: "5000px", contentVisibility2: "auto" }}>
          {arr.map((n) => (
            <Number n={n} />
          ))}
        </ul>
      ) : // <Number n={10} />
      null}
      <p>
        <LinkV2 to="/route2">Go next</LinkV2>
        <button
          onClick={() => {
            // alert("prog'matic navigatiion to be implemented");
            routeHandler.navigator.go("/route2", { a: 10 });
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

const photoURL = "https://picsum.photos/200"; // Gives pic of size 200x200
const getMyAwesomePic = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(photoURL), 500);
  });
};

const DynCompo = async () => {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(10), 3000);
  });
  return import("../compos/ComponentPatterns").then((comp) => {
    return comp?.PropsDriven({ n: "This will be loaded dynamically" }) || null;
  });
};

// SimpleRoute

export const SimpleRoute = () => {
  const [r, setr] = createSignal(0);
  const [pst, setPst] = atom(0);
  const [data, setData] = atom(null);
  // const tv = pst.get("r");
  let ref = null;

  // const [arrState] = state({ arr: ["10", "20"] });

  onMount(() => {
    console.log("Ref available in onMount for SimpleRoute", ref);

    fetch("http://192.168.2.15:8080/verbs-v2.json")
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        // console.log(res);
        setData(res);
      })
      .catch((e) => {
        console.log(e);
      });

    setTimeout(() => {
      setData(null);
    }, 7000);
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

  const Row = ({ n }) => <p>{n}</p>;

  return () => {
    // console.log(pst());
    return (
      <div ref={(_ref) => (ref = _ref)}>
        {/* route2
        <Link href="/">Go Back</Link>
        <hr /> */}
        {/* <div>
          <h3>{pst() % 2 === 0 ? <Even /> : <Odd />}</h3>
          <button onClick={() => setPst((_pst) => _pst + 1)}>Change</button>
        </div> */}

        <TextArea />

        <Suspense
          fallback={
            <div className="lds-roller">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          }
          fetch={getMyAwesomePic()}
        >
          {(res) => {
            // console.log(res);
            return (
              <div>
                <img src={res} alt="pic" />
              </div>
            );
          }}
        </Suspense>
        <Suspense fallback={"Loading..."}>
          <DynCompo />
        </Suspense>

        {data() ? (
          <div>
            <h3>This data will get erased after 7 seconds</h3>
            {data()?.map((d) => {
              const sv = d?.sv?.join(", ");
              return <Row n={JSON.stringify(d)} />;
            })}
          </div>
        ) : null}
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
  const [curPath, setCurPath] = state({ url: window.location.pathname });
  // const [route, setRoute] = signal("route2");

  const onRouteChange = (newPath) => {
    console.log(newPath);
    setCurPath(newPath);
  };
  // moved globally
  // let routeHandler = Router();

  onMount(() => {
    routeHandler.init(onRouteChange);
  });

  onCleanup(() => {
    routeHandler.cleanup();
  });

  return () => {
    // switch (route()) {
    //   // switch (route()) {
    //   case "route2":
    //     return <SimpleRoute />;
    //   case "":
    //     return <ComplexRoute />;
    //   // case null:
    //   //   return null;
    //   default:
    //     return "Wrong path 404";
    // }

    return (
      <div>
        <ul>
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
        </ul>

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
  };
}
