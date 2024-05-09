"use strict";

var _jsxHandler = _interopRequireDefault(require("./jsx-handler"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; } // https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs/
var context = [];
function untrack(fn) {
  var prevContext = context;
  context = [];
  var res = fn();
  context = prevContext;
  return res;
}
function cleanup(observer) {
  var _iterator = _createForOfIteratorHelper(observer.dependencies),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var dep = _step.value;
      dep["delete"](observer);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  observer.dependencies.clear();
}
function subscribe(observer, subscriptions) {
  subscriptions.add(observer);
  observer.dependencies.add(subscriptions);
}
function createSignal(value) {
  var subscriptions = new Set();
  var read = function read() {
    var observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };
  var write = function write(newValue) {
    value = newValue;
    for (var _i = 0, _arr = _toConsumableArray(subscriptions); _i < _arr.length; _i++) {
      var observer = _arr[_i];
      // console.log(observer)
      observer.execute();
    }
  };
  return [read, write];
}
function createEffect(fn) {
  var effect = {
    execute: function execute() {
      cleanup(effect);
      context.push(effect);
      fn();
      context.pop();
    },
    dependencies: new Set()
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
  return (0, _jsxHandler["default"])("ul", null, (0, _jsxHandler["default"])("li", null, "First, select the element by using DOM methods such as", (0, _jsxHandler["default"])("code", null, (0, _jsxHandler["default"])("a", {
    href: "https://www.javascripttutorial.net/javascript-dom/javascript-queryselector/"
  }, "document.querySelector()")), ". The selected element has the", (0, _jsxHandler["default"])("code", null, (0, _jsxHandler["default"])("a", {
    href: "https://www.javascripttutorial.net/javascript-dom/javascript-style/"
  }, "style")), "property that allows you to set the various styles to the element."), (0, _jsxHandler["default"])("li", null, "Then, set the values of the properties of the ", (0, _jsxHandler["default"])("code", null, "style"), " object."), (0, _jsxHandler["default"])("li", null, props.more));
}
function makeAdder() {
  var count = 0;
  return function () {
    count += 10;
    return count;
  };
}
var _createSignal = createSignal("b4"),
  _createSignal2 = _slicedToArray(_createSignal, 2),
  name2 = _createSignal2[0],
  setName = _createSignal2[1];
var _createSignal3 = createSignal(100),
  _createSignal4 = _slicedToArray(_createSignal3, 2),
  count2 = _createSignal4[0],
  setCount2 = _createSignal4[1];
createEffect(function () {
  // console.log(count2())
  // console.log(Counter())

  console.log(context);
  document.getElementById("test").innerHTML = "";
  console.log((0, _jsxHandler["default"])(Counter, null));
  var dt = document.getElementById("test").appendChild((0, _jsxHandler["default"])(App, null));
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

  var _count = makeAdder(); //simple

  return (0, _jsxHandler["default"])("div", null, (0, _jsxHandler["default"])("p", null, "simple Counter is ", _count()), (0, _jsxHandler["default"])("p", null, "signal Counter is ", name2(), " ", count2()), (0, _jsxHandler["default"])("button", {
    onClick: function onClick(e) {
      // console.log(e)
      // console.log(_count())    //simple
      setCount2(count2() + 10);
    }
  }, "Click me"), (0, _jsxHandler["default"])("button", {
    onClick: function onClick(e) {
      // console.log(e)
      // console.log(_count())    //simple
      setName("akshay");
    }
  }, "Name"));
}

// works
function App() {
  return (0, _jsxHandler["default"])("div", null, (0, _jsxHandler["default"])("h1", {
    style: {
      color: "green"
    }
  }, "Plain JS for JSX "), [10, 20, 30].map(function (it) {
    return (0, _jsxHandler["default"])("p", null, it);
  }), (0, _jsxHandler["default"])(List, {
    more: "more"
  }, (0, _jsxHandler["default"])("h3", null, "h3")), (0, _jsxHandler["default"])(Counter, null), (0, _jsxHandler["default"])(Counter, null));
}