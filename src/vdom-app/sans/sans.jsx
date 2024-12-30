import { atom, batch, skipUpdate, state } from "../../utils/simple-state";
import { h, onMount, onCleanup, Suspense } from "../../utils/vdom/vdom-lib";

import "./sans-style.css";

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
      return JSON.parse(localStorage.getItem(keyFormat + _key))?.d;
    },
  };
};

const TABS = {
  VERBS: 0,
  WORDS: 1,
};

const globalState = {
  words: [],
  verbs: [],
};

// const [filtered, setFiltered] = atom([]);
const [search, setSearch] = atom("");

const VerbRow = () => {
  return ({ row: verb }) => (
    <div className="divrow">
      <h3>{verb?.ev}</h3>
      <p> {verb?.sv?.join(", ")}</p>
      <p>{verb?.gana?.join(", ")}</p>
      <p>{verb?.lyut?.join(", ")}</p>
      <p>{verb?.kta?.join(", ")}</p>
      <p>{verb?.mv?.join(", ")}</p>
      {/* {row?.ev}, {row?.sv?.join(", ")}, {row?.mv?.join(", ")} */}
      {/* <hr /> */}
    </div>
  );
};

const verbFilter = (w) => {
  let flag = w?.ev?.includes(search());

  if (!flag) {
    for (let i = 0; i < w?.sv?.length; i++) {
      if (w?.sv[i].indexOf(search()) > -1) {
        flag = true;
        break;
      }
    }
  }

  if (!flag) {
    for (let i = 0; i < w?.mv?.length; i++) {
      if (w?.mv[i].indexOf(search()) > -1) {
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
      {word?.ew}, {word?.sw?.join(", ")}, {word?.mw?.join(", ")}
    </li>
  );
};

const wordFilter = (w) => {
  let flag = w?.ew?.includes(search());

  if (!flag) {
    for (let i = 0; i < w?.sw?.length; i++) {
      if (w?.sw[i].indexOf(search()) > -1) {
        flag = true;
        break;
      }
    }
  }

  if (!flag) {
    for (let i = 0; i < w?.mw?.length; i++) {
      if (w?.mw[i].indexOf(search()) > -1) {
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
    jsonFile: "verbs-v2",
    filterFunc: verbFilter,
    RowComponent: VerbRow,
  },
  [TABS.WORDS]: {
    title: "Words",
    dkey: "words",
    jsonFile: "words",
    filterFunc: wordFilter,
    setDatacb: (data) =>
      data["Everyday words"].concat(data["home"]).concat(data["eng other"]),
    RowComponent: WordRow,
    asList: true,
  },
};

const loadData = () => {
  const { updateData, get } = localStore();

  if (get()) {
    // console.log("")
    // updateData();
  } else {
    // updateData();

    console.log("first time");

    const promises = [],
      updateReqd = [];

    Object.keys(UIObj).forEach((key) => {
      const data = get(`${UIObj[key].dkey}`);

      if (!data) {
        // promises.push(fetch(`/data/${UIObj[key].jsonFile}.json`));
        promises.push(fetchData(UIObj[key].jsonFile));
        updateReqd.push(UIObj[key].dkey);
      } else promises.push(Promise.resolve(data));
    });

    return Promise.all(promises).then((res) => {
      Object.keys(UIObj).forEach((key) => {
        // let data = await res[key].json();
        let data = res[key];

        data =
          UIObj[key].setDatacb && !data?.length
            ? UIObj[key].setDatacb(data)
            : data;

        if (updateReqd.includes(UIObj[key].dkey))
          requestIdleCallback(() => {
            updateData(`${UIObj[key].dkey}`, data);

            updateReqd.splice(updateReqd.indexOf(UIObj[key].dkey), 1);
          });
        // console.log(data);

        // console.log(data);
        globalState[`${UIObj[key].dkey}`] = data;
        // console.log(`${UIObj[key].dkey}`, globalState[`${UIObj[key].dkey}`]);
      });
    });
  }
};

const fetchData = (jsonFile) =>
  fetch(`/data/${jsonFile}.json`).then((res) => res.json());

function GenericTab({ dkey }) {
  let lsearch = null,
    filtered = () => [];

  const [data, setData] = atom(globalState[`${dkey}`]);
  // const [filtered, setFiltered] = atom([]);

  // const filter = () => {
  //   setFiltered(data().filter(filterFunc));
  //   lsearch = search();
  // };

  return ({ title, RowComponent, asList, filterFunc }) => {
    if (lsearch !== search()) {
      // filter();
      lsearch = search();
      if (lsearch) filtered = () => data().filter(filterFunc);
    }

    console.log("exec");

    return (
      <div>
        <h2>{title}</h2>

        {filtered().length === 0 && search() ? (
          <p style={{ color: "red" }}>No results</p>
        ) : null}

        {asList ? (
          <ul>
            {(filtered().length > 0 ? filtered() : data()).map((d) => (
              <RowComponent row={d} />
            ))}
          </ul>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {(filtered().length > 0 ? filtered() : data()).map((d) => (
              <RowComponent row={d} />
            ))}
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

// function WordTab() {
//   let lsearch = null;
//   const [data, setData] = atom(globalState.words);
//   const [filtered, setFiltered] = atom([]);

//   onMount(() => {
//     if (globalState.words.length === 0) {
//       fetch("/data/words.json")
//         .then((res) => res.json())
//         .then((_data) => {
//           // console.log(data, data["home"]);
//           setData(_data["Everyday words"].concat(_data["home"]));
//           // setGlobalState((prev) => ({ ...prev, words: data() }));
//           globalState.words = _data["Everyday words"].concat(_data["home"]);
//         });
//     }
//   });

//   const filter = () => {
//     setFiltered(data().filter(wordFilter));
//   };

//   return () => {
//     if (lsearch !== search()) {
//       filter();
//       lsearch = search();
//     }

//     return (
//       <div>
//         <h1>Words</h1>

//         <p style={{ color: "red" }}>
//           {filtered().length === 0 ? "No results" : ""}
//         </p>
//         <ul>
//           {(filtered().length > 0 ? filtered() : data()).map((w) => (
//             <li>
//               {w?.ew}, {w?.sw?.join(", ")}, {w?.mw}
//             </li>
//           ))}
//         </ul>
//       </div>
//     );
//   };
// }

function Tabs() {
  return ({ currTab }) => {
    return (
      <div style={{ minHeight: "220px" }}>
        <GenericTab key={UIObj[currTab].dkey} {...UIObj[currTab]} />
        {/*
        {currTab === TABS.WORDS ? (
          <GenericTab
            key={UIObj[TABS.WORDS].dkey}
            {...UIObj[TABS.WORDS]}
            RowComponent={WordRow}
            setDatacb={(_data) => _data["Everyday words"].concat(_data["home"])}
          />
        ) : null} */}
      </div>
    );
  };
}

export function Sans() {
  const [currTab, setCurrTab] = atom(0);
  const [isLoaded, setIsLoaded] = atom(false);

  onMount(() => {
    console.log("mount for Sans");
    // setSearch("");
    loadData()
      .then(() => {
        console.log("data loaded");
        setIsLoaded(true);
      })
      .catch((err) => {
        console.log(err);
        isLoaded(true);
      });
  });

  onCleanup(() => {
    console.log("unmount for Sans");
    // skipUpdate(() => setSearch(""));
    setSearch("");
  });

  return (props) => (
    <div className="sans">
      <h1>Sanskrit</h1>
      <div>
        <input
          value={search()}
          type="text"
          onInput={(e) => setSearch(e.target.value)}
        />
      </div>

      <p>{search()}</p>

      <p>
        <button onClick={() => setCurrTab(TABS.VERBS)}>Verbs</button>
        <button onClick={() => setCurrTab(TABS.WORDS)}>Words</button>
      </p>
      {isLoaded() ? <Tabs currTab={currTab()} /> : <p>Loading...</p>}

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
