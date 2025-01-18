import { atom, batch, skipUpdate, state } from "../../utils/simple-state";
import {
  h,
  onMount,
  onCleanup,
  Suspense,
  Skip,
} from "../../utils/vdom/vdom-lib";

import "./sans-style.css";

const env = import.meta.env;

const localStore = () => {
  // let lastUpdated = localStorage.getItem("lastUpdated");
  // if (lastUpdated) {
  //   return lastUpdated;
  // }
  const keyFormat = (window?.location?.host || "localhost") + ":sans:";

  return {
    updateData: (_key, data) => {
      // localStorage.setItem("lastUpdated", Date.now());
      // console.log(keyFormat, _key, data);
      localStorage.setItem(
        keyFormat + _key,
        JSON.stringify({
          ts: Date.now(),
          d: data,
        })
      );
    },
    get: (_key) => {
      // const key = keyFormat + _key;
      // console.log(localStorage.getItem(keyFormat + _key));
      // return JSON.parse(localStorage.getItem(keyFormat + _key))?.d;
      return JSON.parse(localStorage.getItem(keyFormat + _key));
    },
  };
};

const TABS = {
  VERBS: 0,
  WORDS: 1,
};

const globalState = {
  words: { d: [], ts: 0 },
  verbs: { d: [], ts: 0 },
};

// const [filtered, setFiltered] = atom([]);
let gsearchPair = null;

const VerbRow = () => {
  return ({ row: verb }) => (
    <div className="divrow">
      <h3>{verb?.ev}</h3>
      <p> {verb?.sv?.join(", ")}</p>
      <p>{verb?.gana?.join(", ")}</p>
      <p>{verb?.roop?.join(", ")}</p>
      <p>{verb?.lyut?.join(", ")}</p>
      <p>{verb?.kta?.join(", ")}</p>
      <p>{verb?.mv?.join(", ")}</p>
      {/* {row?.ev}, {row?.sv?.join(", ")}, {row?.mv?.join(", ")} */}
      {/* <hr /> */}
    </div>
  );
};

const verbFilter = (w) => {
  // let srch = search();
  let srch = gsearchPair[0]()?.trim()?.toLowerCase();
  let flag = w?.ev?.includes(srch);

  if (!flag) {
    for (let i = 0; i < w?.sv?.length; i++) {
      if (w?.sv[i].indexOf(srch) > -1) {
        flag = true;
        break;
      }
    }
  }

  if (!flag) {
    for (let i = 0; i < w?.mv?.length; i++) {
      if (w?.mv[i].indexOf(srch) > -1) {
        flag = true;
        break;
      }
    }
  }

  return flag;
};

const WordRow = () => {
  return ({ row: word }) => (
    <li>
      <h3>{word?.ew}</h3>
      <p>{word?.sw?.join(", ")}</p>
      <p>{word?.mw?.join(", ")}</p>
    </li>
  );
};

const wordFilter = (w) => {
  // let srch = search();
  let srch = gsearchPair[0]()?.trim()?.toLowerCase();
  let flag = w?.ew?.includes(srch);

  if (!flag) {
    for (let i = 0; i < w?.sw?.length; i++) {
      if (w?.sw[i].indexOf(srch) > -1) {
        flag = true;
        break;
      }
    }
  }

  if (!flag) {
    for (let i = 0; i < w?.mw?.length; i++) {
      if (w?.mw[i].indexOf(srch) > -1) {
        flag = true;
        break;
      }
    }
  }

  return flag;
};

const UIObj = {
  [TABS.VERBS]: {
    title: "Verbs",
    dkey: "verbs",
    jsonFile: env.VITE_VERBS, //" "verbs-v2",
    filterFunc: verbFilter,
    RowComponent: VerbRow,
  },
  [TABS.WORDS]: {
    title: "Words",
    dkey: "words",
    jsonFile: env.VITE_WORDS, //"words.json",
    filterFunc: wordFilter,
    setDatacb: (data) =>
      data["Everyday words"].concat(data["home"]).concat(data["eng other"]),
    RowComponent: WordRow,
    asList: true,
  },
};

const loadData = (updateAvailable = false) => {
  const { updateData, get } = localStore();

  const promises = [],
    updateReqd = [],
    lazyUpdateReqd = [];

  Object.keys(UIObj).forEach((key) => {
    const data = get(`${UIObj[key].dkey}`);

    if (!data || updateAvailable) {
      // data unavailable
      promises.push(fetchData(UIObj[key].jsonFile));
      updateReqd.push(UIObj[key].dkey);
    } else {
      // data available
      const { ts, d } = data;
      promises.push(Promise.resolve({ ts, d: d || [] }));
    }
  });

  return Promise.all(promises).then((res) => {
    Object.keys(UIObj).forEach((key) => {
      // let data = await res[key].json();
      let data = res[key]?.d || res[key]; // d is when local data is available

      // transform data
      data =
        UIObj[key].setDatacb && !data?.length
          ? UIObj[key].setDatacb(data)
          : data;

      data?.shift?.();
      data?.shift?.();

      if (updateReqd.includes(UIObj[key].dkey))
        // update local storage whenever possible
        requestIdleCallback(() => {
          updateData(`${UIObj[key].dkey}`, data);

          updateReqd.splice(updateReqd.indexOf(UIObj[key].dkey), 1);
        });
      // console.log(data);

      // console.log(data);
      globalState[`${UIObj[key].dkey}`].d = data;
      globalState[`${UIObj[key].dkey}`].ts = res[key]?.ts || 0;
      // console.log(`${UIObj[key].dkey}`, globalState[`${UIObj[key].dkey}`]);
      // console.log(globalState);
    });
  });
};

const fetchData = (jsonFile) =>
  // fetch(`/data/${jsonFile}.json`).then((res) => res.json());
  fetch(`${env.VITE_BASEPATH}${jsonFile}`).then((res) => res.json());

function GenericTab({ dkey }) {
  let lsearch = null,
    filtered = () => [];

  const [data, setData] = atom(globalState[`${dkey}`].d.slice(0, 20));
  // const [filtered, setFiltered] = atom([]);

  // const filter = () => {
  //   setFiltered(data().filter(filterFunc));
  //   lsearch = search();
  // };

  return ({ prop, search: srch, dkey }) => {
    const { title, filterFunc, RowComponent, asList } = UIObj[prop];
    // let srch = search();
    // let srch = gsearchPair[0]();
    if (lsearch !== srch) {
      // filter();
      lsearch = srch;
      if (lsearch) {
        filtered = () => globalState[`${dkey}`].d.filter(filterFunc);
      } else filtered = () => [];
    }

    console.log("exec");

    // const RR = (filtered().length > 0 ? filtered() : data()).map((d) => (
    //   <RowComponent row={d} />
    // ));

    return (
      <div>
        <h2 className="title">{title}</h2>

        {filtered().length === 0 && srch ? (
          <p className="info">No results for your search: "{srch}"</p>
        ) : null}

        {filtered().length > 0 && srch ? (
          <p className="info">Showing {filtered().length} results</p>
        ) : null}

        {asList ? (
          <ul className="list">
            {(filtered().length > 0 ? filtered() : data()).map((d, i) => (
              <RowComponent key={"k" + i} search={srch} row={d} />
            ))}
            {/* {RR} */}
          </ul>
        ) : (
          <div
            className="search"
            // style2={{ display: "flex", flexWrap: "wrap" }}
          >
            {(filtered().length > 0 ? filtered() : data()).map((d, i) => (
              <RowComponent key={"k" + i} search={srch} row={d} />
            ))}
            {/* {RR} */}
          </div>
        )}
      </div>
    );
  };
}

// function VerbTab() {
//   const [data, setData] = atom(globalState.verbs);
//   const [filtered, setFiltered] = atom([]);
//   let lsearch = null;

//   onMount(() => {
//     if (globalState.verbs.length === 0) {
//       fetch("/data/verbs-v2.json")
//         .then((res) => res.json())
//         .then((_data) => {
//           // console.log(data);
//           setData(_data);
//           // setGlobalState((prev) => ({ ...prev, verbs: data() }));
//           globalState.verbs = _data;
//         });
//     }
//   });

//   const filter = () => {
//     setFiltered(data().filter(verbFilter));
//   };

//   return () => {
//     if (lsearch !== search()) {
//       filter();
//       lsearch = search();
//     }

//     return (
//       <div>
//         <h1>Verbs</h1>

//         <p style={{ color: "red" }}>
//           {filtered().length === 0 && search() ? "No results" : ""}
//         </p>
//         <ul>
//           {(filtered().length > 0 ? filtered() : data()).map((w) => (
//             <li>
//               {w?.ev}, {w?.sv?.join(", ")}, {w?.mv?.join(", ")}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   };
// }

export function Sans() {
  const [currTab, setCurrTab] = atom(0);
  const [isLoaded, setIsLoaded] = atom(false);
  // gsearchPair = atom("");

  const [search, setSearch] = (gsearchPair = atom(""));

  onMount(() => {
    console.log("mount for Sans");

    // setSearch("");
    //
    loadData()
      .then(() => {
        // console.log(globalState);
        setIsLoaded(true);

        // check if its latest data
        // load remote data ts
        fetch(`${env.VITE_BASEPATH}${env.VITE_TS}?ts=${Date.now()}`)
          .then((res) => res.json())
          .then((res) => {
            // console.log(res);
            // remoteDataTs = res
            let updateCount = 0;
            Object.keys(globalState).forEach((key) => {
              if (globalState[key].ts < res[key]) {
                console.log("update for", key);
                updateCount += 1;
              }
            });

            if (updateCount > 0) {
              loadData(true);
            }
          });
      })
      .catch((err) => {
        console.log(err);
        isLoaded(true);
      });
  });

  onCleanup(() => {
    console.log("unmount for Sans");
    skipUpdate(() => setSearch(""));
    // setSearch("");
  });

  return (props) => (
    <div className="sans">
      <header className="sticky-header">
        <h1 className="main-head">संस्कृतकोष:</h1>

        <div style={{ textAlign: "center" }}>
          <input
            value={search()}
            type="text"
            placeholder="Search in English or Sanskrit..."
            onInput={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* <p>{search()}</p> */}

        <p className="tabs">
          <button onClick={() => setCurrTab(TABS.VERBS)}>Verbs</button>
          <button onClick={() => setCurrTab(TABS.WORDS)}>Words</button>
        </p>
      </header>
      {/* <Skip
        onMount={() => console.log("skip onMount")}
        onCleanup={() => console.log("skip cleanup")}
      >
        <header style={{ backgroundColor: "bisque" }}>footer with skip</header>
      </Skip> */}
      {isLoaded() ? (
        <div className="search-wrapper">
          <GenericTab
            key={UIObj[currTab()].dkey}
            dkey={UIObj[currTab()].dkey}
            prop={currTab()}
            search={search()}
          />
        </div>
      ) : (
        <p>Loading...</p>
      )}

      {/* <Suspense
        key={"tabs"}
        cacheKey="tabs"
        // fallback={<div>Loading...</div>}
        fallback={<p>Loading...</p>}
        fetch={loadData()}
      >
        {() => <Tabs currTab={currTab()} />}
      </Suspense> */}
    </div>
  );
}
