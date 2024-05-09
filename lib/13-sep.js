"use strict";

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
// https://frontendmasters.com/blog/vanilla-javascript-reactivity/
// https://gist.github.com/1Marc/09e739caa6a82cc176ab4c2abd691814

// https://dev.to/fabiospampinato/voby-simplifications-over-solid-no-babel-no-compiler-5epg
// voby link ^

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
var subscriptions = new Set();
function createSignal(value) {
  var read = function read() {
    var observer = context[context.length - 1];
    if (observer) subscribe(observer, subscriptions);
    return value;
  };
  var write = function write(newValue) {
    value = newValue;
    for (var _i = 0, _arr = _toConsumableArray(subscriptions); _i < _arr.length; _i++) {
      var observer = _arr[_i];
      observer.execute();
    }
  };
  return [read, write];
}

// my modified createSignal

// function createSignal(_initValue) {
//     let first=true;
//     let value;

//     if(first) {
//         value = _initValue
//         first = false
//     }

//     const read = () => {
//         return value;
//     }
//     const write = (newValue) => {
//         value = newValue;
//     }

//     return [read, write]
// }

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
function createMemo(fn) {
  var _createSignal = createSignal(),
    _createSignal2 = _slicedToArray(_createSignal, 2),
    signal = _createSignal2[0],
    setSignal = _createSignal2[1];
  createEffect(function () {
    return setSignal(fn());
  });
  return signal;
}

/** @jsx render2 */

var globarr = [];
var map = new Map();
var dom = function dom(eleType, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    var ret = eleType(props, children);
    return ret;
  }
  var el = document.createElement(eleType);
  Object.keys(props || {}).forEach(function (k) {
    if (k === "style") {
      Object.keys(props[k]).forEach(function (sk) {
        el.style[sk] = props[k][sk];
      });
    } else {
      // el[k] = props[k]
      if (k !== null && k !== void 0 && k.startsWith("on")) {
        var evtName = k.replace(/on/, "").toLowerCase();
        el.addEventListener(evtName, props[k]);
      } else {
        el[k] = props[k];
      }
    }
  });
  var addChild = function addChild(child) {
    if (Array.isArray(child)) {
      child.forEach(function (c) {
        return addChild(c);
      });
    } else if (_typeof(child) === "object" && child != null) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(child));
    }
  };
  (children || []).forEach(function (c) {
    // console.log(el, c)
    addChild(c);
  });
  return el;
};
var render2 = function render2(vNode) {
  // create the element
  //   e.g. <div></div>
  var $el = document.createElement(vNode.tagName);

  // add all attributs as specified in vNode.attrs
  //   e.g. <div id="app"></div>
  for (var _i2 = 0, _Object$entries = Object.entries(vNode.attrs); _i2 < _Object$entries.length; _i2++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2),
      k = _Object$entries$_i[0],
      v = _Object$entries$_i[1];
    $el.setAttribute(k, v);
  }

  // append all children as specified in vNode.children
  //   e.g. <div id="app"><img></div>
  var _iterator2 = _createForOfIteratorHelper(vNode.children),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var child = _step2.value;
      $el.appendChild(render2(child));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return $el;
};

// 28 sep

var Closure = function () {
  var hooks = [];
  var idx = 0;
  var useState = function useState(iv, cb) {
    var state = hooks[idx] || iv;
    var _idx = idx;
    var setState = function setState(nv) {
      hooks[_idx] = nv;
      cb === null || cb === void 0 || cb(nv);
    };
    idx++;
    return [state, setState];
  };
  var render = function render(C) {
    idx = 0;
    // const c = C()
    console.log(C.render());
    // C.render()
    return C;
  };
  return {
    useState: useState,
    render: render
  };
}();
function Compo() {
  var _Closure$useState = Closure.useState("app", function (nv) {
      console.log("effect: updated", nv);
    }),
    _Closure$useState2 = _slicedToArray(_Closure$useState, 2),
    s = _Closure$useState2[0],
    sets = _Closure$useState2[1];
  var _Closure$useState3 = Closure.useState(0, function (nv) {
      console.log("effect: updated", nv);
    }),
    _Closure$useState4 = _slicedToArray(_Closure$useState3, 2),
    c = _Closure$useState4[0],
    setc = _Closure$useState4[1];
  var render = function render() {
    // console.log('effect: c is updated', _c)
    return render2("div", null, "aksh ", s, ": ", c);
  };
  return {
    render: render,
    updatec: function updatec(nv) {
      return setc(nv);
    },
    updates: function updates(nv) {
      return sets(nv);
    }
  };
}
var c = Compo();

// console.log(Closure.render(c))

c.updates("mango");
c = Closure.render(c);
c.updatec(4000);
c = Closure.render(c);

// end 28-sep

var global = {
  a: 10
};
function Global() {
  return render2("div", null, "just some global ", global.a);
}
function List(_state) {
  var state = _objectSpread({}, _state);
  console.log(_state.arr);
  return state.uo ? render2("ul", null, " ", ((state === null || state === void 0 ? void 0 : state.arr) || []).map(function (el) {
    return render2("li", null, el);
  })) : render2("ol", null, " ", ((state === null || state === void 0 ? void 0 : state.arr) || []).map(function (el) {
    return render2("li", null, el);
  }));
}

// new

function Input(_state) {
  var _createSignal3 = createSignal("aksh"),
    _createSignal4 = _slicedToArray(_createSignal3, 2),
    t = _createSignal4[0],
    sett = _createSignal4[1];
  var update = function update(p) {
    var input = document.querySelector("#test input");
    input.parentNode.replaceChild(render, input);
  };
  var render = render2("input", {
    type: "text",
    onChange: function onChange(e) {
      sett(e.target.value);
      // update()
      // console.log(getFn(), state)
    },

    value: t(),
    placeholder: "your name"
  });
  createEffect(function () {
    console.log("create effect");
    return render;
  });
  return render;
}
function Input2() {
  var _Closure$useState5 = Closure.useState("aksh"),
    _Closure$useState6 = _slicedToArray(_Closure$useState5, 2),
    t = _Closure$useState6[0],
    sett = _Closure$useState6[1];
  return render2("input", {
    type: "text",
    onChange: function onChange(e) {
      sett(e.target.value);
      // update()
      // console.log(getFn(), state)
    },

    value: t,
    placeholder: "your name"
  });
}

// end

function Counter() {
  var _dom = document.getElementById("test");
  var update = function update() {
    _dom.replaceChild(Counter(), _dom.firstChild);
  };

  // const [arr, setarr] = Closure.useState(null, update)
  var _Closure$useState7 = Closure.useState(0, update),
    _Closure$useState8 = _slicedToArray(_Closure$useState7, 2),
    ctr = _Closure$useState8[0],
    setCtr = _Closure$useState8[1];
  return render2("div", null, "hello world ", ctr, render2(Input2, null), render2("button", {
    onClick: function onClick() {
      setCtr(ctr + 10);
    }
  }, "incr"));
}
document.getElementById("test").appendChild(render2(Counter, null));

// https://dev.to/ycmjason/building-a-simple-virtual-dom-from-scratch-3d05
// https://codesandbox.io/s/vdommm-forked-4q29hq?file=/src/main.js  //my updated ver