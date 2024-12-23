import { atom, batch, state } from "../../utils/simple-state";
import { h, onMount, onCleanup } from "../../utils/vdom/vdom-lib";

const TABS = {
  VERBS: 0,
  WORDS: 1,
};

const [globalState, setGlobalState] = state({
  words: [],
  verbs: [],
});

// const [filtered, setFiltered] = atom([]);
const [search, setSearch] = atom("");

const VerbRow = () => {
  return ({ row: verb }) => (
    <li>
      <h3>{verb?.ev}</h3>
      <p> {verb?.sv?.join(", ")}</p>
      <p>{verb?.gana?.join(", ")}</p>
      <p>{verb?.lyut?.join(", ")}</p>
      <p>{verb?.kta?.join(", ")}</p>
      <p>{verb?.mv?.join(", ")}</p>
      {/* {row?.ev}, {row?.sv?.join(", ")}, {row?.mv?.join(", ")} */}
      <hr />
    </li>
  );
};

const verbFilter = (w) => {
  return (
    w?.ev?.includes(search()) ||
    w?.sv?.forEach((s) => s.includes(search())) ||
    w?.mv?.forEach((m) => m.includes(search()))
  );
};

const WordRow = () => {
  return ({ row: word }) => (
    <li>
      {word?.ew}, {word?.sw?.join(", ")}, {word?.mw?.join(", ")}
    </li>
  );
};

const wordFilter = (w) => {
  return (
    w?.ew?.includes(search()) ||
    w?.sw?.forEach((s) => s.includes(search())) ||
    w?.mw?.forEach((m) => m.includes(search()))
  );
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
    setDatacb: (data) => data["Everyday words"].concat(data["home"]),
    RowComponent: WordRow,
  },
};

const fetchData = (jsonFile) =>
  fetch(`/data/${jsonFile}.json`).then((res) => res.json());

function GenericTab({ dkey, jsonFile, setDatacb, filterFunc }) {
  let lsearch = null;
  const [data, setData] = atom(globalState()[`${dkey}`]);
  const [filtered, setFiltered] = atom([]);

  onMount(() => {
    if (globalState()[`${dkey}`].length === 0) {
      // fetch(`/data/${jsonFile}.json`)
      //   .then((res) => res.json())
      fetchData(jsonFile).then((_data) => {
        setDatacb ? setData(setDatacb(_data)) : setData(_data);
        setGlobalState((prev) => ({ ...prev, [`${dkey}`]: data() }));

        if (search()) {
          lsearch = search();
          filter();
        }
      });
    }
  });

  const filter = () => {
    setFiltered(data().filter(filterFunc));
  };

  return ({ title, RowComponent }) => {
    if (lsearch !== search()) {
      filter();
      lsearch = search();
    }

    return (
      <div>
        <h1>{title}</h1>
        <p style={{ color: "red" }}>
          {filtered().length === 0 && search() ? "No results" : ""}
        </p>
        <ul>
          {(filtered().length > 0 ? filtered() : data()).map((d) => (
            <RowComponent row={d} />
          ))}
        </ul>
      </div>
    );
  };
}

function VerbTab() {
  const [data, setData] = atom(globalState().verbs);
  const [filtered, setFiltered] = atom([]);
  let lsearch = null;

  onMount(() => {
    if (globalState().verbs.length === 0) {
      fetch("/data/verbs-v2.json")
        .then((res) => res.json())
        .then((_data) => {
          // console.log(data);
          setData(_data);
          setGlobalState((prev) => ({ ...prev, verbs: data() }));
        });
    }
  });

  const filter = () => {
    setFiltered(data().filter(verbFilter));
  };

  return () => {
    if (lsearch !== search()) {
      filter();
      lsearch = search();
    }

    return (
      <div>
        <h1>Verbs</h1>

        <p style={{ color: "red" }}>
          {filtered().length === 0 && search() ? "No results" : ""}
        </p>
        <ul>
          {(filtered().length > 0 ? filtered() : data()).map((w) => (
            <li>
              {w?.ev}, {w?.sv?.join(", ")}, {w?.mv?.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    );
  };
}

function WordTab() {
  let lsearch = null;
  const [data, setData] = atom(globalState().words);
  const [filtered, setFiltered] = atom([]);

  onMount(() => {
    if (globalState().words.length === 0) {
      fetch("/data/words.json")
        .then((res) => res.json())
        .then((_data) => {
          // console.log(data, data["home"]);
          setData(_data["Everyday words"].concat(_data["home"]));

          setGlobalState((prev) => ({ ...prev, words: data() }));
        });
    }
  });

  const filter = () => {
    setFiltered(data().filter(wordFilter));
  };

  return () => {
    if (lsearch !== search()) {
      filter();
      lsearch = search();
    }

    return (
      <div>
        <h1>Words</h1>

        <p style={{ color: "red" }}>
          {filtered().length === 0 ? "No results" : ""}
        </p>
        <ul>
          {(filtered().length > 0 ? filtered() : data()).map((w) => (
            <li>
              {w?.ew}, {w?.sw?.join(", ")}, {w?.mw}
            </li>
          ))}
        </ul>
      </div>
    );
  };
}

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

  onCleanup(() => {
    console.log("unmount for Sans");
  });

  return () => (
    <div>
      <h1>Sanskrit</h1>
      <div>
        <input type="text" onInput={(e) => setSearch(e.target.value)} />
      </div>
      <div>
        <p>{search()}</p>
      </div>
      <p>
        <button onClick={() => setCurrTab(TABS.VERBS)}>Verbs</button>
        <button
          onClick={() => setCurrTab(TABS.WORDS)}
          // onMouseOver={() => {
          //   fetchData(UIObj[TABS.WORDS].jsonFile);
          // }}
        >
          Words
        </button>
      </p>

      <Tabs currTab={currTab()} />
    </div>
  );
}
