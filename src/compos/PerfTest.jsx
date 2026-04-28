// https://github.com/krausest/js-framework-benchmark

import { h, createContext } from "../utils/vdom/vdom-lib";

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

const dataCtx = createContext([]);
const unusedCtx = createContext("something");

let nextId = 0;

const buildData = (count) => {
  const data = new Array(count);

  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }

  return data;
};

const listReducer = (state, action) => {
  //   const { data, selected } = state;
  //   const data = dataCtx.get();
  const selected = -1;
  let data = [];

  switch (action.type) {
    case "RUN":
      data = buildData(SIZE);
      dataCtx.set(data);
      return { data: data, selected: 0 };
    case "RUN_LOTS":
      data = buildData(SIZE * 10);
      dataCtx.set(data);
      return { data: data, selected: 0 };
    case "ADD":
      const newData = dataCtx.get().slice(0);
      data = newData.concat(buildData(SIZE));
      dataCtx.set(data);
      return { data: data, selected };
    case "UPDATE": {
      const _d = dataCtx.get();

      if (_d.length === 0) return { data: _d, selected };

      const newData = _d.slice(0);

      for (let i = 0; i < newData.length; i += 10) {
        const r = newData[i];

        newData[i] = { id: r.id, label: r.label + " !!!" };
      }
      dataCtx.set(newData);

      return { data: newData, selected };
    }
    case "CLEAR":
      dataCtx.set([]);
      return { data: [], selected: 0 };
    case "SWAP_ROWS":
      const newdata = [...dataCtx.get()];
      if (newdata.length > 998) {
        const d1 = newdata[1];
        const d998 = newdata[998];
        newdata[1] = d998;
        newdata[998] = d1;
        dataCtx.set(newdata);
      }

      return { data: newdata, selected };
    case "REMOVE": {
      data = dataCtx.get();
      // const idx = data.findIndex((d) => d.id === action.id);
      // data = [...data.slice(0, idx), ...data.slice(idx + 1)];
      data = data.filter((v) => {
        return v.id !== action.id;
      });
      dataCtx.set(data);
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

const Row = ({ selected, item }) => (
  <tr id={item.id} className={selected ? "danger" : ""}>
    <td className="col-md-1">{item.id}</td>
    <td className="col-md-4">
      <a onClick={() => listReducer(null, { type: "SELECT", id: item.id })}>
        {item.label}
      </a>
    </td>
    <td className="col-md-1">
      <a onClick={() => listReducer(null, { type: "REMOVE", id: item.id })}>
        <span className="glyphicon glyphicon-remove" aria-hidden="true" />
        Remove
      </a>
    </td>
    <td className="col-md-6" />
  </tr>
);

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

const Jumbotron = ({ dispatch }) => (
  <div className="jumbotron">
    <div className="row">
      <div className="col-md-6">
        <h1>VDOM Framework</h1>
      </div>
      <div className="col-md-6">
        <div className="row">
          <Button
            id="run"
            title="Create 1,000 rows"
            cb={() => dispatch(null, { type: "RUN" })}
          />
          <Button
            id="runlots"
            title="Create 10,000 rows"
            cb={() => dispatch(null, { type: "RUN_LOTS" })}
          />
          <Button
            id="add"
            title="Append 1,000 rows"
            cb={() => dispatch(null, { type: "ADD" })}
          />
          <Button
            id="update"
            title="Update every 10th row"
            cb={() => dispatch(null, { type: "UPDATE" })}
          />
          <Button
            id="clear"
            title="Clear"
            cb={() => dispatch(null, { type: "CLEAR" })}
          />
          <Button
            id="swaprows"
            title="Swap Rows"
            cb={() => dispatch(null, { type: "SWAP_ROWS" })}
          />
        </div>
      </div>
    </div>
  </div>
);

const TBody = () => {
  const data = dataCtx.get();
  const selected = -1;
  return (
    <tbody
      id="tbody"
      style={{ background: "red" }}
      onClick={() => console.log("tbody clicked")}
    >
      {data.map((item) => (
        <Row
          // key={item.id}
          item={item}
          selected={selected === item.id}
          // dispatch={listReducer}
        />
      ))}
    </tbody>
  );
};

export const PerfTest = () => {
  const jumbo = unusedCtx.get();
  return (
    <div className="container">
      <span className="typing"></span>
      <span className="typing"></span>
      <span className="typing"></span>
      <Jumbotron dispatch={listReducer} />
      <table className="table table-hover table-striped test-data">
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
