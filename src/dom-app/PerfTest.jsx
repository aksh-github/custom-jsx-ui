// https://github.com/krausest/js-framework-benchmark

import {
  h,
  signal,
  computed,
  addPatches,
  effect,
  diffKeyedChildren,
  batch,
  For,
  ReactiveText,
} from "@dom-lib";

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
    data[i].key = data[i].id;
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
      // 1. Clear existing
      // batch(() => {
      //   setDataCtx([]);
      //   addPatches([
      //     {
      //       op: "REMOVEALL",
      //       p: $tbody,
      //     },
      //   ]);

      //   // 2. Add fresh data
      // setDataCtx((prev) => {
      //   data = buildData(SIZE);
      // patches = diffKeyedChildren($tbody, [], data);
      // patches.forEach((p, idx) => {
      //   ((p.p = $tbody), (p.c = <Row selected={false} item={data[idx]} />));
      // });

      // addPatches(patches);
      //   return data;
      // });
      // });

      setDataCtx(buildData(SIZE));

      return { data: data, selected: 0 };
      break;
    case "RUN_LOTS":
      setDataCtx(buildData(SIZE * 10));

      return { data: data, selected };
      break;
    case "UPDATE": {
      const _d = dataCtx();

      if (_d.length === 0) return { data: _d, selected };

      const newData = _d.slice(0);

      const trOf10 = $tbody.querySelectorAll("tr:nth-child(2n)");
      patches = [];

      for (let i = 1; i < newData.length; ++i) {
        if (i % 2 === 0) {
          newData[i].label += " !!!";

          let p = $tbody?.querySelector(`#${newData[i].id}`)?.childNodes[1];

          patches.push({
            op: "CONTENT",
            p: p,
            c: newData[i].label,
          });
        }
      }
      setDataCtx(newData);
      addPatches(patches);

      return { data: newData, selected };
    }
    case "CLEAR":
      // setDataCtx((prev) => {
      //   patches = diffKeyedChildren($tbody, dataCtx(), []);

      //   // console.log(patches);

      //   patches.forEach((p, idx) => {
      //     p.c = $tbody.querySelector(`#${p.key}`);
      //   });

      //   addPatches(patches);
      //   return [];
      // });
      setDataCtx([]);

      return { data: [], selected: 0 };
    case "SWAP_ROWS":
      data = [...dataCtx()];
      if (data.length > 998) {
        const d1 = data[1];
        const d998 = data[998];
        data[1] = d998;
        data[998] = d1;

        // patches = diffKeyedChildren($tbody, dataCtx(), data);
        // // console.log(patches);
        // patches.forEach((p, idx) => {
        //   ((p.p = $tbody), (p.c = $tbody.querySelector(`#${p.key}`)));
        // });

        // addPatches(patches);

        setDataCtx(data);

        // addPatches([
        //   {
        //     op: "MOVE",
        //     p: $tbody,
        //     fromIndex: 998,
        //     toIndex: 1,
        //   },
        //   {
        //     op: "MOVE",
        //     p: $tbody,
        //     fromIndex: 1,
        //     toIndex: 998,
        //   },
        // ]);
      }

      return { data: data, selected };
    case "REMOVE":
      const old = (data = dataCtx());
      // const idx = data.findIndex((d) => d.id === action.id);
      // data = [...data.slice(0, idx), ...data.slice(idx + 1)];
      data = data.filter((v) => {
        return v.id !== action.id;
      });

      setDataCtx(data);

      // patches = diffKeyedChildren($tbody, old, data);
      // patches.forEach((p, idx) => {
      //   ((p.p = $tbody), (p.c = $tbody.querySelector(`#${p.key}`)));
      // });
      // // console.log(patches);
      // addPatches(patches);

      return {
        data: data,
        selected,
      };
      break;
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
    e.stopPropagation();
    const { id } = e.target;
    setOp(id);

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
const [dataCtx, setDataCtx] = signal(buildData(4));
const [op, setOp] = signal("");
// const [$tbody, setTbody] = signal(null);
let $tbody = null;

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
    e.stopPropagation();

    const tr = e.target.closest("tr");
    const td = e.target.closest("td");

    if (tr) {
      listReducer(null, {
        type: td?.dataset.tag,
        id: tr.getAttribute("key"),
      });
      setOp(td?.dataset.tag);
    }
  };

  const stopEff = effect(() => {
    // console.log(diffKeyedChildren($tbody, [], dataCtx()));
    // console.log(dataCtx());
    dataCtx();
    console.log("Data changed");
  });

  return (
    <tbody
      id="tbody"
      style={style}
      ref={(el) => ($tbody = el)}
      // onClick={tableClickHandler}
      onMount={() => {
        // setDataCtx(buildData(4));
      }}
      onUnmount={() => {
        stopEff();
        // $tbody = null;
        // setTbody(null);
      }}
    >
      {/* {data.map((item) => (
        <Row
          key={item.id}
          item={item}
          selected={selected === item.id}
          // dispatch={listReducer}
        />
      ))} */}
      <For
        parent={$tbody}
        each={dataCtx}
        keyBy={(item) => item.id}
        render={(item) => <Row key={item.id} item={item} />}
        updateParentRef={(el) => ($tbody = el)}
      />
    </tbody>
  );
};

export const PerfTest = () => {
  const tableClickHandler = (e) => {
    // const target = e.target;
    e.stopPropagation();

    const tr = e.target.closest("tr");
    const td = e.target.closest("td");

    if (tr) {
      listReducer(null, {
        type: td?.dataset.tag,
        id: tr.getAttribute("key"),
      });
    }
  };

  let $op = null;
  let txtContent = computed();

  // effect(() => {
  //   const _op = op();
  //   if ($op) $op.textContent = `Current op: ${_op}`;
  // });

  return (
    <div className="container">
      <span className="typing"></span>
      <span className="typing"></span>
      <span className="typing"></span>
      <Jumbotron dispatch={listReducer} />
      {/* <p
        ref={(el) => ($op = el)}
        id="current-op"
        onUnmount={() => {
          $op = null;
        }}
      >
        {op()}
      </p> */}
      <ReactiveText
        type="p"
        elementProps={{
          id: "current-op",
          onMount: () => {
            console.log("ReactiveText mounted");
          },
        }}
        value={op}
        textContent={(val) => `Current op: ${val}`}
      />
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

// unrelated

const v1 = h("ul", {}, [
  h("li", { key: "a", textContent: "Item A" }),
  h("li", { key: "b", textContent: "Item B" }),
  h("li", { key: "c", textContent: "Item C" }),
  h("li", { key: "d", textContent: "Item C (updated)" }),
  h("li", { key: "e", textContent: "Item E" }),
  h("li", { key: "f", textContent: "Item F" }),
  h("li", { key: "G", textContent: "Item G" }),
]);

const v2 = h("ul", {}, [
  h("li", { key: "a", textContent: "Item A" }),
  h("li", { key: "f", textContent: "Item F" }),
  h("li", { key: "c", textContent: "Item C (updated)" }),
  h("li", { key: "d", textContent: "Item D" }),
  h("li", { key: "e", textContent: "Item E" }),
  h("li", { key: "b", textContent: "Item B" }),
  h("li", { key: "G", textContent: "Item G" }),
  // h("li", { key: "c", textContent: "Item C" }),
  // h("li", { key: "a", textContent: "Item A" }),
  // h("li", { key: "b", textContent: "Item B" }),
]);

// console.log(v1, v2);
// console.log(diffKeyedChildren(undefined, v1.children, v2.children));

// unrelated end
// 2 > 0
// 1 > 2
// 0 > 1
