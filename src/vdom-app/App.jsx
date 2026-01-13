// import { createSignal } from "../utils/signal-complex";
import {
  h,
  createElement,
  Lazy,
  memo,
  createState,
  batch,
  skipUpdate,
  createEffect,
  Switch,
  VirtualList,
} from "@vdom-lib";
import HoleComponent from "../compos/web-compo";
// import { dom, onMount, onCleanup } from "lib-jsx";
// import Link from "./compos/Link";

import {
  LinkV2,
  routerContext,
  RouterAdv,
  routerInstance,
  RouterSwitch,
  // Route,
} from "@router-v2";

// import { ArrayWithFragments } from "../compos/ComponentPatterns";

import Heavy from "../compos/Heavy";
import { JsonFormConsumer } from "./dyn-json/JsonFormConsumer";
import { Embed } from "../compos/ComponentPatterns";
import {
  DynArrayWithFragments,
  DynCompo,
  DynSans,
  DynTextArea,
} from "../compos/DynamicExports";
// import { } from "../utils/vdom/switch";
// import { Sans } from "./sans/sans";

const Topic = ({ topicId }) => <h3>{topicId}</h3>;

const items = [
  { name: "Props v. State", slug: "props-v-createState" },
  { name: "Rendering with React", slug: "rendering" },
  { name: "Components", slug: "components" },
];

const Topics = (props) => {
  // console.log(routerContext.get());
  const { pathname } = routerContext.get();
  // const basepath = routerContext.get()?.pathname;
  const { basepath } = props;

  const item = items.find(({ name, slug }) => {
    return pathname?.endsWith(slug);
  });

  // console.log(item);

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
      <h3>Sub routes</h3>

      <Topic topicId={(item?.name || "") + " on " + pathname} />
    </div>
  );
};

// Ctr

const Ctr = (props) => {
  const [st, setSt] = createState({ c: 100, version: "Loading..." });

  createEffect(() => {
    fetch("/package.json")
      .then((res) => res.json())
      .then((res) => {
        setSt((prev) => ({
          ...prev,
          version: res.version,
        }));
      });

    return () => {
      console.log("unmount Ctr");
    };
  }, []);

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

  createEffect(() => {
    return () => {
      console.log("unmount Input");
    };
  }, []);

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
      {/* <SuspenseV2
        key="dyntext"
        cacheKey="dyntext"
        fallback={<div>Loading TextArea...</div>}
      >
        <DynTextArea />
      </SuspenseV2> */}
      <DynTextArea />
    </div>
  );
};

// ComplexRoute (route 1)

const Number = ({ n }) => {
  // if you have memoized comp in heirachy, createEffect is of no use
  // createEffect(() => {
  //   console.log("mounting number");
  //   return () => {
  //     console.log("unmounting number");
  //   };
  // }, []);

  return (
    <li>
      <span>{n}</span>
    </li>
  );
};

const ArrayCompMemo = memo(({ arr: _arr }) => {
  // if you have memoized comp in heirachy, createEffect is of no use
  // this is ok
  createEffect(() => {
    console.log("number changed");
  }, [_arr]);

  return (
    <ul className="long-list">
      {_arr.map((n) => (
        <Number n={n} />
      ))}
    </ul>
  );
}, "ArrayCompMemo");

let arr = [];

const ArrayCompVirtual = ({ arr: _arr }) => {
  // if you have memoized comp in heirachy, createEffect is of no use
  // this is ok
  createEffect(() => {
    console.log("number changed");
  }, [_arr]);

  // Your custom render function for each item
  const renderListItem = (item) => <Number n={item} />;

  return (
    <section>
      <h3>Virtual List</h3>
      <VirtualList
        items={_arr}
        renderItem={renderListItem}
        itemHeight={35}
        windowHeight={500}
      />
    </section>
  );
};

function ComplexRoute(props) {
  console.log("rendered App", props);
  // const [c, setc] = createSignal(0);
  // const [s, sets] = createSignal("akshay");
  const [c, setc] = createState(0);
  const [s, sets] = createState("akshay");

  let ref = null;
  let _holec = 0;

  const [holec, setHolec] = createState(0);

  createEffect(() => {
    // console.log("mount app", ref);
    let wc = document.querySelector("hole-component");

    let intervalId = setInterval(() => {
      // console.log(wc, holec);
      wc?.setAttribute("message", `Hello from wc after ${_holec} seconds`);
      skipUpdate(() => {
        setHolec((prev) => {
          // console.log(prev);
          _holec = prev + 2;
          return _holec;
        });
      });
      // setHolec((prev) => {
      //   console.log(prev);
      //
      //   return prev + 2;
      // });

      if (_holec > 4) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }, 1000);

    if (!arr) arr = [];

    for (let i = 0; i < 10000; ++i) {
      arr.push(i);
    }

    return () => {
      ref = wc = null;
      arr.length = 0;
      arr = null;
      clearInterval(intervalId);
    };
  }, []);

  // createEffect(() => {
  //   if (c % 2 === 0) arr = null;
  //   else {
  //     for (let i = 0; i < 10000; ++i) arr.push(i);
  //   }
  // }, [c]);

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
      {/* {c % 2 !== 0 ? <ArrayCompMemo arr={arr} /> : null} */}
      {c % 2 !== 0 ? <ArrayCompVirtual arr={arr} /> : null}
      <p>
        <LinkV2 to="/route2?q=some">Go next</LinkV2>
        <button
          onClick={() => {
            // alert("prog'matic navigatiion to be implemented");
            routerInstance.navigator.go("/route2", { a: 10 });
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
  createEffect(() => {
    console.log("onMount for Even");
    return () => {
      console.log("unmount for Even");
    };
  }, []);

  return "Divisible by 2";
};

const SomeOdd = () => {
  createEffect(() => {
    console.log("onMount for SomeOdd");
    return () => {
      console.log("unmount for SomeOdd");
    };
  }, []);

  return "[SomeOdd]";
};

const Odd = () => {
  createEffect(() => {
    console.log("onMount for Odd");
    return () => {
      console.log("unmount for Odd");
    };
  }, []);

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

  createEffect(() => {
    // console.log("Ref available in onMount for SimpleRoute", ref);
    return () => {
      console.log("unmount for SimpleRoute");
      ref = null;
    };
  }, []);

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

      <DynTextArea />

      {/* <Lazy
        key="picurl"
        fallback={
          <div
            style={{
              minHeight: "200px",
            }}
            className="lds-roller"
          >
            <div></div>
          </div>
        }
        // cacheKey="picurl"
        fetchFn={getMyAwesomePic}
      >
        {(res) => {
          console.log(res);
          return (
            <div className="simple-img">
              <img src={res} alt="pic" />
            </div>
          );
        }}
      </Lazy> */}
      <img src="https://picsum.photos/200" alt="some pic" />

      <DynCompo />

      <p>after</p>
    </div>
  );
};

const Header = () => (
  <ul className="nav">
    <li>
      <LinkV2 to="/">Complex</LinkV2>
    </li>
    <li>
      <LinkV2 to="/embed">Embed YT,MD</LinkV2>
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
);

const MyRouteSwitch = ({ curPath }) => {
  switch (curPath) {
    // switch (route()) {
    case "/route2":
      return <SimpleRoute />;
    case "/":
      return <ComplexRoute />;
    case "/embed":
      return <Embed />;
    // return <Ctr v={10} />;
    case "/frag":
      console.log("frag");
      const t = Date.now();

      return (
        <div>
          <div>before text</div>
          {/* <SuspenseV2
                  delay={3000}
                  cacheKey={"awfp"}
                  fallback={<div>Loading...</div>}
                >
                  <ArrayWithFragmentsPromise some={t} />
                </SuspenseV2> */}
          <DynArrayWithFragments t={Date.now()} />

          <div>after text</div>
        </div>
      );

    case "/sans":
      // return <Sans />;
      console.log("sans");
      return (
        // <Lazy
        //   importFn={SansCompoPromise}
        //   resolve="Sans"
        //   fallback={<p>Loading Sanskrit...</p>}
        //   key={"Sans"}
        // />
        <DynSans />
      );
    case "/heavy":
      return <Heavy />;
    case "/json-form":
      return <JsonFormConsumer />;
    default:
      if (curPath?.startsWith("/topics")) return <Topics basepath="/topics" />;
      else return "Wrong path 404";
  }
};

const routeObj = {
  "/": ComplexRoute,
  "/embed": Embed,
  "/frag": {
    render: () => {
      const t = Date.now();

      return (
        <div>
          <div>before text</div>
          <DynArrayWithFragments t={Date.now()} />
          <div>after text</div>
        </div>
      );
    },
  },
  "/sans": {
    render: () => (
      <Lazy
        importFn={() => import("./sans/sans")}
        resolve="Sans"
        fallback={<p>Loading Sanskrit...</p>}
        key="sans"
      />
    ),
  },
  "/heavy": Heavy,
  "/json-form": JsonFormConsumer,
  404: {
    render: () => {
      // console.log(routerContext.get());
      const curPath = routerContext.get()?.pathname;
      if (curPath?.startsWith("/topics")) return <Topics basepath="/topics" />;
      else return "Wrong path 404";
    },
  },
  "/route2": SimpleRoute,
  // "/topics": () => <Topics basepath="/topics" match={curPath} />,
};

export function App(props) {
  // console.log(routerContext.get());
  const curPath = routerContext.get()?.pathname;
  let footRef = null;
  let [footerTp, setFooterTp] = createState(0);
  let timer = null;

  // console.log(routerContext.get());

  let ct = 0;

  createEffect(() => {
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

    return () => {
      clearInterval(timer);
      timer = footRef = null;
    };
  }, []);

  const MySwitch = ({ type, cp }) => {
    // switch (type) {
    //   case "built-in":
    //     return <BuiltInSwitch curPath={cp} />;
    //   case "dyn":
    //     return <RouterAdv routeObj={routeObj} />;
    //   case "switch":
    //   default:
    //     return <MyRouteSwitch curPath={cp} />;
    // }
    return (
      <Switch value={type}>
        <Switch.Case
          when="built-in"
          render={() => <BuiltInSwitch curPath={cp} />}
        />
        <Switch.Case
          when="dyn"
          render={() => <RouterAdv routeObj={routeObj} />}
        />
        <Switch.Default render={() => <MyRouteSwitch curPath={cp} />} />
      </Switch>
    );
  };

  return (
    <div>
      <Header />
      <hr />

      <MySwitch type={props.type} cp={curPath} />

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
function BuiltInSwitch() {
  return (
    <RouterSwitch>
      <RouterSwitch.Route path="/" component={ComplexRoute} />
      <RouterSwitch.Route path="/route2" component={SimpleRoute} />
      <RouterSwitch.Route path="/embed" component={Embed} />
      <RouterSwitch.Route
        path="/frag"
        render={() => {
          const t = Date.now();

          return (
            <section>
              <div>before text</div>
              <DynArrayWithFragments t={Date.now()} />
              <div>after text</div>
            </section>
          );
        }}
      />
      <RouterSwitch.Route
        path="/topics"
        exact={false}
        render={() => <Topics basepath="/topics" />}
      />
      <RouterSwitch.Route
        path="/topics/*"
        exact={false}
        render={() => <Topics basepath="/topics" />}
      />

      <RouterSwitch.Route path="/heavy" component={Heavy} />
      <RouterSwitch.Route path="/json-form" component={JsonFormConsumer} />
      <RouterSwitch.Route
        path="/sans"
        render={() => (
          <Lazy
            importFn={() => import("./sans/sans")}
            resolve="Sans"
            fallback={<p>Loading Sanskrit...</p>}
            key="sans"
          />
        )}
      />
      <RouterSwitch.Route
        path="*"
        render={() => {
          return <h1>Not Found</h1>;
        }}
      />
    </RouterSwitch>
  );
}
