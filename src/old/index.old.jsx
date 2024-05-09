// https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs/

import dom from "../lib";

let context = [];

function untrack(fn) {
  const prevContext = context;
  context = [];
  const res = fn();
  context = prevContext;
  return res;
}

function cleanup(observer) {
  for (const dep of observer.dependencies) {
    dep.delete(observer);
  }
  observer.dependencies.clear();
}

function subscribe(observer, subscriptions) {
  subscriptions.add(observer);
  observer.dependencies.add(subscriptions);
}

function createSignal(value) {
  const subscriptions = new Set();

  const read = () => {
    const observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };
  const write = (newValue) => {
    value = newValue;
    for (const observer of [...subscriptions]) {
      // console.log(observer)
      observer.execute();
    }
  };

  return [read, write];
}

function createEffect(fn) {
  const effect = {
    execute() {
      cleanup(effect);
      context.push(effect);
      fn();
      context.pop();
    },
    dependencies: new Set(),
  };

  effect.execute();
}

// /** @jsx dom */

// let ctr = 0;
// let last = null;
// let arr = [];

// const dom = (eleType, props, ...children) => {
//   // console.log({eleType, props, children})
//   // console.log(typeof eleType)

//   if (typeof eleType === "function") {
//     // console.log('func', eleType, eleType.parentNode)
//     return eleType(props, children);
//   }

//   const el = document.createElement(eleType);
//   el.dataset.id = ctr++;
//   Object.keys(props || {}).forEach((k) => {
//     if (k === "style") {
//       Object.keys(props[k]).forEach((sk) => {
//         el.style[sk] = props[k][sk];
//       });
//     } else {
//       // el[k] = props[k]
//       if (k?.startsWith("on")) {
//         const evtName = k.replace(/on/, "").toLowerCase();
//         el.addEventListener(evtName, props[k]);
//       } else {
//         el[k] = props[k];
//         if (k === "$") console.log(el);
//       }
//       // console.log('spl handling for: ', k)
//     }
//   });

//   const addChild = (child) => {
//     if (Array.isArray(child)) {
//       child.forEach((c) => addChild(c));
//     } else if (typeof child === "object" && child != null) {
//       el.appendChild(child);
//     } else {
//       el.appendChild(document.createTextNode(child));
//     }
//   };

//   // if(children)
//   // console.log(children.length)

//   (children || []).forEach((c) => addChild(c));

//   // console.log(children)

//   last = el;

//   return el;
// };

function List(props) {
  console.log(props);
  return (
    <ul>
      <li>
        First, select the element by using DOM methods such as
        <code>
          <a href="https://www.javascripttutorial.net/javascript-dom/javascript-queryselector/">
            document.querySelector()
          </a>
        </code>
        . The selected element has the
        <code>
          <a href="https://www.javascripttutorial.net/javascript-dom/javascript-style/">
            style
          </a>
        </code>
        property that allows you to set the various styles to the element.
      </li>
      <li>
        Then, set the values of the properties of the <code>style</code> object.
      </li>
      <li>{props.more}</li>
    </ul>
  );
}

function makeAdder() {
  let count = 0;
  return function () {
    count += 10;
    return count;
  };
}

const [name2, setName] = createSignal("b4");
const [count2, setCount2] = createSignal(100);
createEffect(() => {
  // console.log(count2())
  // console.log(Counter())

  console.log(context);

  document.getElementById("test").innerHTML = "";
  console.log(<Counter />);
  const dt = document.getElementById("test").appendChild(<App />);
  // document.getElementById('test').appendChild(<List more={'tpp'} />)
});

// createEffect(()=> {
//     // console.log(count2())
//     // console.log(Counter())
//     document.getElementById('test').innerHTML=''
//     document.getElementById('test').appendChild(Counter())
// })

function Counter() {
  // const [count, setCount] = createSignal(10)
  // createEffect(()=> {
  //     console.log(count())
  // })

  const _count = makeAdder(); //simple

  return (
    <div>
      <p>simple Counter is {_count()}</p>
      <p>
        signal Counter is {name2()} {count2()}
      </p>
      <button
        onClick={(e) => {
          // console.log(e)
          // console.log(_count())    //simple
          setCount2(count2() + 10);
        }}
      >
        Click me
      </button>
      <button
        onClick={(e) => {
          // console.log(e)
          // console.log(_count())    //simple
          setName("akshay");
        }}
      >
        Name
      </button>
    </div>
  );
}

// works
function App() {
  return (
    <div>
      <h1 style={{ color: "green" }}>Plain JS for JSX </h1>
      {[10, 20, 30].map((it) => {
        return <p>{it}</p>;
      })}
      <List more="more">
        <h3>h3</h3>
      </List>
      <Counter />
      <Counter />
    </div>
  );
}
