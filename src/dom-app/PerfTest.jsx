// https://github.com/krausest/js-framework-benchmark

import { h, signal, addPatches, effect } from "@dom-lib";

const SIZE = 1000;

const random = (max) => Math.round(Math.random() * SIZE) % max;

const A = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];
const C = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const N = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

const [dataCtx, setDataCtx] = signal([]);
// const [$tbody, setTbody] = signal(null);
let $tbody = null;

const generateAlphaID = () => {
  // Convert random number to base-36 string and extract 6 characters
  return `t-${Math.random().toString(36).substring(2, 8)}`;
};

const buildData = (count) => {
  const data = new Array(count);

  for (let i = 0; i < count; i++) {
    data[i] = {
      id: generateAlphaID(),
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }

  return data;
};

const listReducer = (state, action) => {
  //   const { data, selected } = state;
  //   const data = dataCtx();
  const selected = -1;
  let data = [];
  let patches = [];
  // let $tbody = null;

  // effect(()=> {
  //   $tbody = $tbody()
  // })

  switch (action.type) {
    case "RUN":
      data = buildData(SIZE);
      setDataCtx(data);

      patches = [];

      data.forEach((it, idx) => {
        patches.push({
          op: "ADD",
          index: idx,
          p: $tbody,
          c: <Row selected={false} item={it} />,
        });
      });

      addPatches(patches);

      return { data: data, selected: 0 };
    case "RUN_LOTS":
      data = buildData(SIZE * 10);
      setDataCtx(data);

      patches = [];

      data.forEach((it, idx) => {
        patches.push({
          op: "ADD",
          index: idx,
          p: $tbody,
          c: <Row selected={false} item={it} />,
        });
      });

      addPatches(patches);

      return { data: data, selected: 0 };

      const newData = dataCtx().slice(0);
      data = newData.concat(buildData(SIZE));
      setDataCtx(data);
      return { data: data, selected };
    case "UPDATE": {
      const _d = dataCtx();

      if (_d.length === 0) return { data: _d, selected };

      const newData = _d.slice(0);

      const trOf10 = $tbody.querySelectorAll("tr:nth-child(10n)");
      patches = [];
      console.log(trOf10.length, newData.length);

      for (let i = 1; i < newData.length; ++i) {
        const r = newData[i];

        if (i % 10 === 0 && trOf10[i]) {
          newData[i] = { id: r.id, label: r.label + " !!!" };

          console.log(i, trOf10[i]);

          patches.push({
            op: "CONTENT",
            p: trOf10[i].childNodes[1],
            c: newData[i].label,
          });
        }
      }
      setDataCtx(newData);
      addPatches(patches);

      return { data: newData, selected };
    }
    case "CLEAR":
      setDataCtx([]);

      addPatches([
        {
          op: "REMOVEALL-FAST",
          p: $tbody,
          ref: (el) => {
            $tbody = el;
            // setTbody(el);
          },
        },
      ]);

      return { data: [], selected: 0 };
    case "SWAP_ROWS":
      const newdata = [...dataCtx()];
      if (newdata.length > 998) {
        const d1 = newdata[1];
        const d998 = newdata[998];
        newdata[1] = d998;
        newdata[998] = d1;
        setDataCtx(newdata);

        addPatches([
          {
            op: "MOVE",
            p: $tbody,
            fromIndex: 998,
            toIndex: 1,
          },
          {
            op: "MOVE",
            p: $tbody,
            fromIndex: 1,
            toIndex: 998,
          },
        ]);
      }

      return { data: newdata, selected };
    case "REMOVE": {
      data = dataCtx();
      // const idx = data.findIndex((d) => d.id === action.id);
      // data = [...data.slice(0, idx), ...data.slice(idx + 1)];
      data = data.filter((v) => {
        return v.id !== action.id;
      });
      setDataCtx(data);

      addPatches([
        {
          op: "REMOVE",
          p: $tbody,
          c: $tbody.querySelector(`#${action.id}`),
        },
      ]);

      return {
        data: data,
        selected,
      };
    }
    case "SELECT":
      return { data, selected: action.id };
    default:
      return state;
  }
};

const Button = ({ id, cb, title }) => (
  <div className="col-sm-6 smallpad">
    <button
      type="button"
      className="btn btn-primary btn-block"
      id={id}
      onClick={cb}
    >
      {title}
    </button>
  </div>
);

const Jumbotron = ({ dispatch }) => {
  const handler = (e) => {
    const { id } = e.target;

    switch (id) {
      case "RUN":
        dispatch(null, { type: "RUN" });
        break;
      case "RUN_LOTS":
        dispatch(null, { type: "RUN_LOTS" });
        break;
      case "ADD":
        dispatch(null, { type: "ADD" });
        break;
      case "UPDATE":
        console.log("came here  ");
        dispatch(null, { type: "UPDATE" });
        break;
      case "CLEAR":
        dispatch(null, { type: "CLEAR" });
        break;
      case "SWAP_ROWS":
        dispatch(null, { type: "SWAP_ROWS" });
        break;
    }

    e.stopPropagation();
  };

  return (
    <div className="jumbotron" onClick={handler}>
      <div className="row">
        <div className="col-md-6">
          <h1>VDOM Framework</h1>
        </div>
        <div className="col-md-6">
          <div className="row">
            <Button id="RUN" title="Create 1,000 rows" />
            <Button id="RUN_LOTS" title="Create 10,000 rows" />
            <Button id="ADD" title="Append 1,000 rows" />
            <Button id="UPDATE" title="Update every 10th row" />
            <Button id="CLEAR" title="Clear" />
            <Button id="SWAP_ROWS" title="Swap Rows" />
          </div>
        </div>
      </div>
    </div>
  );
};

const style = { background: "beige" };

const Row = ({ selected, item }) => (
  <tr key={item.id} id={item.id} className={selected ? "danger" : ""}>
    <td className="col-md-1">{item.id}</td>
    <td className="col-md-4">
      <a onClick={() => listReducer(null, { type: "SELECT", id: item.id })}>
        {item.label}
      </a>
    </td>
    <td className="col-md-1" data-tag="REMOVE">
      <a>
        <span className="glyphicon glyphicon-remove" aria-hidden="true" />
        Remove
      </a>
    </td>
    <td className="col-md-6" />
  </tr>
);

const TBody = () => {
  const data = dataCtx();
  const selected = -1;

  const tableClickHandler = (e) => {
    // const target = e.target;

    const tr = e.target.closest("tr");
    const td = e.target.closest("td");

    if (tr) {
      listReducer(null, {
        type: td?.dataset.tag,
        id: tr.getAttribute("key"),
      });
    }
    e.stopPropagation();
  };

  const stopEff = effect(() => {
    console.log(dataCtx());
  });

  return (
    <tbody
      id="tbody"
      style={style}
      ref={(el) => ($tbody = el)}
      // onClick={tableClickHandler}
      onUnmount={() => {
        stopEff();
        // $tbody = null;
        // setTbody(null);
      }}
    >
      {data.map((item) => (
        <Row
          key={item.id}
          item={item}
          selected={selected === item.id}
          // dispatch={listReducer}
        />
      ))}
    </tbody>
  );
};

export const PerfTest = () => {
  const tableClickHandler = (e) => {
    // const target = e.target;

    const tr = e.target.closest("tr");
    const td = e.target.closest("td");

    if (tr) {
      listReducer(null, {
        type: td?.dataset.tag,
        id: tr.getAttribute("key"),
      });
    }
    e.stopPropagation();
  };

  return (
    <div className="container">
      <span className="typing"></span>
      <span className="typing"></span>
      <span className="typing"></span>
      <Jumbotron dispatch={listReducer} />
      <table
        className="table table-hover table-striped test-data"
        onClick={tableClickHandler}
      >
        <TBody />
      </table>
      <span
        className="preloadicon glyphicon glyphicon-remove"
        aria-hidden="true"
      >
        some
      </span>
    </div>
  );
};
