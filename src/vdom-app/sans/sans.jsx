// import { memo } from "../../utils/vdom/memo";
import { h, createEffect, createState, Lazy } from "@vdom-lib"; // or from "../../utils/vdom/vdom-lib";

import "./sans-style.css";
import "./worddict.css";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// import { WordDict } from "./Word-Dict";

const DynamicWordDict = () => {
  // return {
  //   comp: () => import("./Word-Dict").then((mod) => mod.WordDict),
  //   preload: () => import("./Word-Dict"),
  // };
  return import("./Word-Dict");
  // .then((mod) => {
  //   console.log("in promise");
  //   return mod.WordDict;
  // });
};

const env = import.meta.env;

const localStore = () => {
  // let lastUpdated = localStorage.getItem("lastUpdated");
  // if (lastUpdated) {
  //   return lastUpdated;
  // }
  const keyFormat = (window?.location?.host || "localhost") + ":sans:";

  return {
    updateData: (_key, hash, data) => {
      // localStorage.setItem("lastUpdated", Date.now());
      // console.log(keyFormat, _key, data);
      localStorage.setItem(
        keyFormat + _key,
        JSON.stringify({
          hash,
          d: data,
        }),
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

const dictionaryData = {
  words: { d: [], hash: 0 },
  verbs: { d: [], hash: 0 },
};

// const [filtered, setFiltered] = createState([]);
let currentSearch = null;

// const searchCtx = context("");

const VerbRow = ({ row: verb }) => {
  return (
    <div className="divrow search-result-borders">
      <h3>
        {verb?.ev} {verb?.mv?.join(", ")}
      </h3>
      <p> {verb?.sv?.join(", ")}</p>
      <p>{verb?.gana?.join(", ")}</p>
      <p>{verb?.roop?.join(", ")}</p>
      <p>{verb?.lyut?.join(", ")}</p>
      <p>{verb?.kta?.join(", ")}</p>
      {/* {row?.ev}, {row?.sv?.join(", ")}, {row?.mv?.join(", ")} */}
      {/* <hr /> */}
    </div>
  );
};

const verbFilter = (w) => {
  let srch = currentSearch?.trim()?.toLowerCase();
  // let srch = searchCtx.get()?.trim()?.toLowerCase();
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

const WordRow = ({ row: word }) => {
  return (
    <li className="search-result-borders">
      <h3>{word?.ew}</h3>
      <p>{word?.sw?.join(", ")}</p>
      <p>{word?.mw?.join(", ")}</p>
    </li>
  );
};

const wordFilter = (w) => {
  // let srch = search();
  let srch = currentSearch?.trim()?.toLowerCase();
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

const keyToExclude = ["updatedAt"];

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
      // data["Everyday words"].concat(data["home"]).concat(data["eng other"]),
      Object.keys(data).reduce((acc, curr) => {
        // if (keyToExclude.includes(curr)) return acc;
        data[curr]?.shift?.();
        return acc.concat(data[curr]);
      }, []),
    RowComponent: WordRow,
    asList: true,
  },
};

const TOP = 10;

const loadLocalData = () => {
  const { get } = localStore();
  let updateReqd = false;

  Object.keys(UIObj).forEach((key) => {
    const { dkey } = UIObj[key];
    const gdata = get(dkey);
    const dictData = dictionaryData[dkey];

    if (gdata) {
      const { hash, d } = gdata;
      Object.assign(dictData, {
        d: shuffle(d),
        hash,
        updateReqd: false,
      });
    } else {
      Object.assign(dictData, {
        updateReqd: true,
        d: [],
        hash: 0,
      });
    }
  });

  // console.log(dictionaryData);

  return updateReqd;
};

const loadRemoteHashData = () => {
  return fetchData(`${env.VITE_TS}?ts=${Date.now()}`).then((hashData) => {
    if (!hashData) return;
    // console.log(res, dictionaryData);

    Object.keys(hashData).forEach((key) => {
      const dictData = dictionaryData[key];

      if (dictData.hash !== hashData[key]) {
        // console.log("update required for", key);
        dictData.updateReqd = true;
        dictData.hash = hashData[key];
      } else {
        dictData.updateReqd = false;
      }
    });

    return Promise.resolve({}); // some non empty value
  });
};

const checkProcessUpdates = () => {
  const promises = [];
  let allGood = 0;

  Object.keys(UIObj).forEach((key) => {
    const dkey = UIObj[key].dkey;
    // console.log(dkey);

    if (dictionaryData[`${dkey}`].updateReqd) {
      console.log("update required for", dkey);
      promises.push(fetchData(UIObj[key].jsonFile));
    }
  });

  if (promises.length === 0) {
    return Promise.resolve({
      alreadyUpdated: true,
    });
  } else {
    return Promise.all(promises).then((res) => {
      // console.log(res);
      if (res?.length === 0) return;

      const { updateData } = localStore();

      res.forEach((item) => {
        // let data = await res[key].json();
        // console.log(data);
        if (item) {
          const dditem = dictionaryData[`${item.type}`];
          if (dditem) {
            const uio = Object.values(UIObj).find(
              (it) => it.dkey === item.type,
            );

            dditem.d = uio?.setDatacb ? uio.setDatacb(item.data) : item.data;
            dditem.updateReqd = false;
            // update local storage
            requestIdleCallback(() => {
              updateData(item.type, dditem.hash, dditem.d);
            });
          }

          ++allGood;
        } else {
        }
      });

      // console.log("after update:", dictionaryData);
      if (allGood === 2)
        return Promise.resolve({
          updatedNow: true,
          allGood,
        });
      // some non empty value
      else {
        Promise.resolve({
          updatedNow: false,
          allGood,
        });
      }
    });
  }
};

const fetchData = (jsonFile) =>
  // fetch(`/data/${jsonFile}.json`).then((res) => res.json());
  fetch(`${env.VITE_BASEPATH}${jsonFile}`)
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .catch((e) => {
      console.error("Something went wrong in reading: " + jsonFile);
      console.error(e);
    });

function GenericTab({ prop, search: srch, dkey }) {
  const { title, filterFunc, RowComponent, asList } = UIObj[prop];
  currentSearch = srch;
  const filtered = srch
    ? dictionaryData[`${dkey}`].d.filter(filterFunc)
    : dictionaryData[`${dkey}`].d?.slice(0, TOP);
  // let filtered = [];

  // if (srch) {
  //   filtered = dictionaryData[`${dkey}`].d.filter(filterFunc);
  // } else {
  //   filtered = dictionaryData[`${dkey}`].d.slice(0, TOP);
  // }

  // console.log("exec", searchCtx.get());

  const RR = filtered.map((d) =>
    d?.ev || d?.ew ? <RowComponent row={d} /> : null,
  );

  return (
    <div>
      <h2 className="title">{title}</h2>
      <p className="data-ver">Data ver.: {dictionaryData[`${dkey}`]?.hash}</p>
      {filtered.length === 0 && srch ? (
        <p className="info">No results for your search: "{srch}"</p>
      ) : null}
      {/* Ctxt Value: {searchCtx.get()} */}
      {filtered.length > 0 && srch ? (
        <p className="info">Matching results: {filtered.length}</p>
      ) : null}
      {asList ? (
        <ul className="list">{RR}</ul>
      ) : (
        <div className="search">{RR}</div>
      )}
    </div>
  );
}

export function Sans() {
  const [currTab, setCurrTab] = createState(0);
  const [isLoaded, setIsLoaded] = createState(false);
  const [showWordDict, setShowWordDict] = createState(false);
  // currentSearch = createState("");
  let chatIcon = null;

  const [search, setSearch] = createState("");
  let timeoutId;

  createEffect(() => {
    // console.log("tab changed to", currTab);
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 0);
  }, [currTab]);

  createEffect(() => {
    console.log("mount for Sans");

    // 1. check and load local data
    const updateReqd = loadLocalData();

    // 2. load remote hash data
    loadRemoteHashData().then((res) => {
      if (!res) {
        console.log("something went wrong");
      }

      //3. load data
      checkProcessUpdates().then((res) => {
        if (!res) {
          console.log("** something wrong in checkProcessUpdates");
        }
        setIsLoaded(true);
      });
    });

    return () => {
      console.log("cleanup for Sans");
      // setSearch("");
      // searchCtx.set("");
      currentSearch = chatIcon = null;
      clearTimeout(timeoutId);
      timeoutId = null;
    };
  }, []);

  return (
    <div className="sans">
      <header className="sticky-header" role="banner">
        <h1 className="main-head">संस्कृतकोष:</h1>

        {/* <div class="radar">
          <div class="inner-circle">
            <div class="sweeper"></div>
          </div>
        </div> */}

        <div className="search-box">
          <input
            value={search}
            type="search"
            name="search"
            placeholder="Search in English or Sanskrit..."
            onInput={(e) => {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                // Call search function here
                setSearch(e.target.value?.trim());
              }, 500);

              // searchCtx.set(e.target.value);
            }}
          />
        </div>

        {/* <p>{search()}</p> */}

        <p className="tabs">
          <button
            onClick={() => {
              setCurrTab(TABS.VERBS);
            }}
          >
            Verbs
          </button>
          <button
            onClick={() => {
              setCurrTab(TABS.WORDS);
            }}
          >
            Words
          </button>
        </p>
      </header>
      {/* <Skip
        onMount={() => console.log("skip onMount")}
        onCleanup={() => console.log("skip cleanup")}
      >
        <header style={{ backgroundColor: "bisque" }}>footer with skip</header>
      </Skip> */}
      {isLoaded ? (
        <main className="search-wrapper" role="main">
          <GenericTab
            key={UIObj[currTab].dkey}
            dkey={UIObj[currTab].dkey}
            prop={currTab}
            search={search}
          />
        </main>
      ) : (
        <p>Loading...</p>
      )}
      {/* {showWordDict ? (
        <Lazy
          importFn={DynamicWordDict}
          resolve="WordDict"
          fallback={<div>Loading Word Dict...</div>}
          toggle={showWordDict}
          onClose={() => setShowWordDict(false)}
        />
      ) : (
        <div
          id="chat-icon"
          ref={(el) => {
            // console.log("chat icon ref", el);
            chatIcon = el;

            const t = setTimeout(() => {
              if (chatIcon) {
                chatIcon.style.animation = "none";
              }
              clearTimeout(t);
            }, 8000);
            el = null;
          }}
          onMouseOver={(e) => {
            // console.log("chat icon mouse over");
            DynamicWordDict();
          }}
          onClick={() => {
            console.log("chat icon clicked");
            setShowWordDict((prev) => !prev);
          }}
        >
          शब्दपाठ
        </div>
      )} */}
    </div>
  );
}

// const Provider = (p, children) => <div>{children}</div>;
