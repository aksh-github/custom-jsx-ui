import { createSignal, createEffect } from "../utils/signal-complex";
import {
  h,
  onMount,
  onCleanup,
  Suspense,
  SuspenseV2,
  createElement,
} from "../utils/vdom/vdom-lib";
import HoleComponent from "../compos/web-compo";
// import { dom, onMount, onCleanup } from "lib-jsx";
// import Link from "./compos/Link";

import { createState, batch, skipUpdate } from "../utils/simple-state";
import { LinkV2, Router } from "../utils/router-v2";

// import { ArrayWithFragments } from "../compos/ComponentPatterns";
import { SimpleSwitch } from "../compos/Switch";
import { signal } from "../utils/signal-v2";
import Heavy from "../compos/Heavy";
import JsonForm from "./dyn-json/jsonform";
import { Lazy } from "../utils/vdom/lazy";

let routeHandler = Router();

// Type 1: Lazy import

// const LoadModule = (path) => import(path);

// let ArrayWithFragments = null,
//   resolved = false;
// let _i = 0;
// const LoadArrayWithFragments = () => {
//   console.log("importing");
//   const promise = LoadModule("../compos/ComponentPatterns?" + _i++)
//     .then((mod) => {
//       // ArrayWithFragments = mod.default;
//       console.log(mod);
//       resolved = true;
//       ArrayWithFragments = mod.ArrayWithFragments;
//     })
//     .catch((e) => {
//       console.log(e);
//       ArrayWithFragments = () => <div>Something went wrong</div>;
//     });
// };
// LoadArrayWithFragments();

// Type 2: Load only when needed

let _i = 0,
  ArrayWithFragments = null;
const ArrayWithFragmentsPromise = () => {
  // if cond is not reqd strictly
  if (ArrayWithFragments) {
    return Promise.resolve(ArrayWithFragments);
  }

  return import("../compos/ComponentPatterns").then((mod) => {
    ArrayWithFragments = mod.ArrayWithFragments;
    // return ArrayWithFragments;
    return ArrayWithFragments;
  });
  // .catch((e) => {
  //   console.log(e);
  // });
};

const photoURL = "https://picsum.photos/200"; // Gives pic of size 200x200
const getMyAwesomePic = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(photoURL), 500);
  });
};

const DynCompoPromise = () => {
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => resolve(10), 3000);
  // });
  return import("../compos/ComponentPatterns").then((mod) => mod?.PropsDriven);
};

const DynTextArea = () => {
  return import("../compos/ComponentPatterns").then((mod) => mod?.TextArea);
};

const SansCompoPromise = () => {
  // await new Promise((resolve, reject) => {
  //   setTimeout(() => resolve(10), 3000);
  // });
  return import("./sans/sans").then((mod) => mod?.Sans);
};

const Topic = ({ topicId }) => <h3>{topicId}</h3>;

const Topics = (props) => {
  const items = [
    { name: "Props v. State", slug: "props-v-createState" },
    { name: "Rendering with React", slug: "rendering" },
    { name: "Components", slug: "components" },
  ];
  // console.log(p);
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

// Ctr

const Ctr = (props) => {
  const [st, setSt] = createState({ c: 100, version: "Loading..." });

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

  return (
    <div
      style={{
        background: st.c % 2 === 0 ? "orange" : "tomato",
        color: st.c % 2 === 0 ? "white" : "unset",
        padding: "2em",
      }}
    >
      <h3>Child {props.key}</h3>
      <p>
        Parent ctr: {props.v} {props.v % 2 === 0 ? "Even" : null}
      </p>
      <p>My ctr: {st.c}</p>
      <p>Json Value: {st.version}</p>
      <button
        onClick={(e) => {
          // setcc(cc() + 1);
          // setSt(()=>{ c: st("c") + 1 });
          setSt((prev) => ({
            ...prev,
            c: prev.c + 1,
          }));
        }}
      >
        click
      </button>
    </div>
  );
};

// end Ctr

const Input = () => {
  const [input, setInput] = createState({
    v: "some",
    e: "",
  });

  onCleanup(() => {
    console.log("unmount Input");
  });

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
        value={input.v}
      />
      <p>{input.e}</p>
      {/* <TextArea /> */}
      <SuspenseV2
        key="dyntext"
        cacheKey="dyntext"
        fallback={<div>Loading TextArea...</div>}
      >
        <DynTextArea />
      </SuspenseV2>
    </div>
  );
};

// ComplexRoute (route 1)

function ComplexRoute(props) {
  console.log("rendered App", props);
  // const [c, setc] = createSignal(0);
  // const [s, sets] = createSignal("akshay");
  const [c, setc] = createState(0);
  const [s, sets] = createState("akshay");
  const [yt, setYt] = createState("t779DVjCKCs");
  let ref = null;

  const [holec, setHolec] = createState(0);
  let intervalId = null;
  let wc = null;

  onMount(() => {
    console.log("mount app", ref);
    wc = document.querySelector("hole-component");
    let _holec = 0;

    if (wc) {
      intervalId = setInterval(() => {
        console.log(wc, holec);
        wc.setAttribute("message", `Hello from wc after ${_holec} seconds`);
        skipUpdate(() => {
          setHolec((prev) => {
            console.log(prev);
            _holec = prev + 2;
            return _holec;
          });
        });
        // setHolec((prev) => {
        //   console.log(prev);
        //   return holec + 2;
        // });
        if (_holec > 4) {
          clearInterval(intervalId);
        }
      }, 2000);
    }
  });

  onCleanup(() => {
    clearInterval(intervalId);
    ref = intervalId = wc = null;
  });

  const arr = [];
  for (let i = 0; i < 10000; ++i) arr.push(i);

  const Number = ({ n }) => {
    // onMount(() => {
    //   console.log("mounting number");
    // });
    // onCleanup(() => {
    //   console.log("unmounting number");
    // });
    return (
      <li>
        <span>{n}</span>
      </li>
    );
  };

  const Master = () => (
    <div>
      <Ctr v={c} key={"k2"} />
      <Input />
    </div>
  );

  return (
    <div
      ref={(_r) => {
        // console.log(_r);
        ref = _r;
      }}
    >
      hello world {c} {s}
      <hole-component
        // ref={(_wc) => (wc = _wc)}
        message={"Hello from wc"}
      ></hole-component>
      <div>
        <span class="menu-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="red">
            <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.116C19.382 3.5 12 3.5 12 3.5s-7.382 0-9.386.57A2.994 2.994 0 0 0 .502 6.186C0 8.19 0 12 0 12s0 3.81.502 5.814a2.994 2.994 0 0 0 2.112 2.116C4.618 20.5 12 20.5 12 20.5s7.382 0 9.386-.57a2.994 2.994 0 0 0 2.112-2.116C24 15.81 24 12 24 12s0-3.81-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </span>
        <span class="menu-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
            <path d="M20.453 3.548H3.547A2.548 2.548 0 0 0 1 6.095v11.81a2.548 2.548 0 0 0 2.547 2.547h16.906A2.548 2.548 0 0 0 23 17.905V6.095a2.548 2.548 0 0 0-2.547-2.547zM21.5 17.905a1.048 1.048 0 0 1-1.047 1.047H3.547A1.048 1.048 0 0 1 2.5 17.905V6.095A1.048 1.048 0 0 1 3.547 5.048h16.906A1.048 1.048 0 0 1 21.5 6.095v11.81zM7.5 8.5v3.5l-1.5-1.5-1.5 1.5V8.5H3v7h2v-2l1.5 1.5 1.5-1.5v2h2v-7zm7.5 0h-2v7h2v-2h2v2h2v-7h-2v2h-2V8.5z" />
          </svg>
        </span>
      </div>
      <input
        type="text"
        value={yt}
        onChange={(e) => {
          // console.log(e, e.target.value);
          setYt(e.target.value);
        }}
      />
      <iframe
        width="100%"
        height="615"
        src={`https://www.youtube.com/embed/${yt}`}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <zero-md src="https://raw.githubusercontent.com/aksh-github/pages/refs/heads/master/data/sanskrit/intro.md"></zero-md>
      <div>
        <button
          onClick={(e) => {
            setc((c) => c + 1);
            sets("akshay is smart");
          }}
        >
          Counter
        </button>
      </div>
      {/* {c() % 2 === 0 ? <Master /> : "NA"}
      {c() % 2 === 0 ? <Master /> : "NA"} */}
      {c % 2 !== 0 ? (
        <ul style={{ minHeight: "8000px", contentVisibility2: "auto" }}>
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
      <Ctr v={c} key={"k1"} />
      {c % 2 === 0 ? <Master /> : "NA"}
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

  return "Divisible by 2";
};

const SomeOdd = () => {
  onMount(() => {
    console.log("onMount for SomeOdd");
  });

  onCleanup(() => {
    console.log("unmount for SomeOdd");
  });

  return "[SomeOdd]";
};

const Odd = () => {
  onMount(() => {
    console.log("onMount for Odd");
  });

  onCleanup(() => {
    console.log("unmount for Odd");
  });

  return (
    <div>
      <SomeOdd />
      NOT divisible
    </div>
  );
};

// SimpleRoute

export const SimpleRoute = () => {
  const [pst, setPst] = createState(0);
  const [data, setData] = createState(null);
  // const tv = pst.get("r");
  let ref = null;

  // const [arrState] = createState({ arr: ["10", "20"] });

  onMount(() => {
    console.log("Ref available in onMount for SimpleRoute", ref);
  });

  onCleanup(() => {
    console.log("unmount for SimpleRoute");
    ref = null;
  });

  const Row = ({ n }) => <p>{n}</p>;

  return (
    <div ref={(_ref) => (ref = _ref)}>
      {/* route2
        <Link href="/">Go Back</Link>
        <hr /> */}
      {/* <div>
          <p>before</p>
          <h3>{pst() % 2 === 0 ? <Even /> : "<Odd />"}</h3>
          <button onClick={() => setPst((_pst) => _pst + 1)}>Change</button>
        </div> */}

      <p>before</p>

      <SuspenseV2
        key="textarea"
        cacheKey="textarea"
        fallback={<div>Loading TextArea...</div>}
      >
        <DynTextArea />
      </SuspenseV2>

      <SuspenseV2
        key="picurl"
        fallback={
          <div className="lds-roller">
            <div></div>
          </div>
        }
        cacheKey="picurl"
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
      </SuspenseV2>
      <SuspenseV2
        key="dyncompo"
        cacheKey="dyncompo"
        fallback={<div>Loading...</div>}
        // fallback="Loading..."
        // errorFallback={<div>Something went wrong</div>}
      >
        <DynCompoPromise n="This will be loaded dynamically" />
      </SuspenseV2>

      <p>after</p>

      {/* {data() ? (
        <div>
          <h3>This data will get erased after 7 seconds</h3>
          {data()?.map((d) => {
            const sv = d?.sv?.join(", ");
            return <Row n={JSON.stringify(d)} />;
          })}
        </div>
      ) : null} */}
    </div>
  );
};

export function App(props) {
  const [curPath, setCurPath] = createState({ url: window.location.pathname });
  // const [route, setRoute] = signal("route2");
  let footRef = null;

  let [footerTp, setFooterTp] = createState(0);
  let timer = null;

  const onRouteChange = (newPath) => {
    console.log(newPath);
    setCurPath(newPath);
  };
  // moved globally
  // let routeHandler = Router();

  let ct = 0;

  onMount(() => {
    routeHandler.init(onRouteChange);
    if (footRef) {
      // const p = document.createElement("p");
      // p.textContent = footerTp();

      // footRef.appendChild(p);
      const p = createElement(<p />);
      // ||
      footRef.appendChild(p);
      footRef.appendChild(
        createElement(
          <div>
            <h1>Static Header</h1>Static content....
          </div>
        )
      );

      const wcd = footRef.querySelector("web-component div");

      timer = setInterval(() => {
        // skipUpdate(() => setFooterTp((_tp) => _tp + 1)); // with createState but skips ui comparison
        // setFooterTp((_tp) => _tp + 1);
        // p.textContent = footerTp();
        ct++;
        p.textContent = "This footer demoes ignoreNode ignoreLater " + ct; // without using createState

        if (wcd) {
          wcd.textContent = "Hello from wc " + ct;
        }
      }, 1000);
    }
  });

  onCleanup(() => {
    routeHandler.cleanup();
    clearInterval(timer);
    timer = null;
    setFootRef(null);
  });

  return (
    <div>
      <ul className="nav">
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
        <li>
          <LinkV2 to="/sans">Sanskrit</LinkV2>
        </li>
        <li>
          <LinkV2 to="/heavy">Heavy</LinkV2>
        </li>
        <li>
          <LinkV2 to="/json-form">Dynamic JSON</LinkV2>
        </li>
      </ul>
      <hr />

      {(() => {
        switch (curPath.url) {
          // switch (route()) {
          case "/route2":
            return <SimpleRoute />;
          case "/":
            return <ComplexRoute />;
          // return <Ctr v={10} />;
          case "/frag":
            console.log("frag");
            const t = Date.now();

            return (
              <div>
                <div>before text</div>
                <SuspenseV2
                  delay={3000}
                  cacheKey={"awfp"}
                  fallback={<div>Loading...</div>}
                >
                  <ArrayWithFragmentsPromise some={t} />
                </SuspenseV2>

                <div>after text</div>
              </div>
            );

          case "/sans":
            // return <Sans />;
            return (
              <SuspenseV2
                key={"sans"}
                cacheKey={"sans"}
                fallback={<p>Loading Sanskrit...</p>}
              >
                <SansCompoPromise />
              </SuspenseV2>
            );
          case "/heavy":
            return <Heavy />;
          case "/json-form":
            return (
              <JsonForm setIsFormValid={() => {}} setRequestObj={() => {}} />
            );
          default:
            if (curPath?.url?.startsWith("/topics"))
              return <Topics basepath="/topics" match={curPath} />;
            else return "Wrong path 404";
        }
      })()}

      <footer
        ref={(_ref) => (footRef = _ref)}
        ignoreNode
        // ignoreLater={true}
        style={{ backgroundColor: "bisque" }}
      ></footer>
      <div>last element....</div>
    </div>
  );
}
