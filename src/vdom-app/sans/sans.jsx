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

  const verbFilter = (w) => {
    return (
      w?.ev?.includes(search()) ||
      w?.sv?.forEach((s) => s.includes(search())) ||
      w?.mv?.forEach((m) => m.includes(search()))
    );
  };

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

  const wordFilter = (w) => {
    return (
      w?.ew?.includes(search()) ||
      w?.sw?.forEach((s) => s.includes(search())) ||
      w?.mw?.forEach((m) => m.includes(search()))
    );
  };

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
      <div>
        {currTab === TABS.VERBS ? <VerbTab /> : null}
        {currTab === TABS.WORDS ? <WordTab /> : null}
      </div>
    );
  };
}

export function Sans() {
  const [currTab, setCurrTab] = atom(0);

  // const verbFilter = (w) => {
  //   return (
  //     w?.ev?.includes(search()) ||
  //     w?.sv?.forEach((s) => s.includes(search())) ||
  //     w?.mv?.forEach((m) => m.includes(search()))
  //   );
  // };

  // const filter = (e) => {
  //   batch(() => {
  //     setSearch(e.target.value);
  //     // setFiltered(data().filter(wordFilter));
  //     setFiltered(data().filter(verbFilter));
  //   });
  // };

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
        <button onClick={() => setCurrTab(TABS.WORDS)}>Words</button>
      </p>

      <Tabs currTab={currTab()} />
    </div>
  );
}
