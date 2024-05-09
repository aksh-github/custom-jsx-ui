"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/** @jsx dom */

var ctr = 0;
var last = null;
var arr = [];
var dom = function dom(eleType, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }
  // console.log({eleType, props, children})
  // console.log(typeof eleType)

  if (typeof eleType === "function") {
    // console.log('func', eleType, eleType.parentNode)
    return eleType(props, children);
  }
  var el = document.createElement(eleType);
  el.dataset.id = ctr++;
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
        if (k === "$") console.log(el);
      }
      // console.log('spl handling for: ', k)
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

  // if(children)
  // console.log(children.length)

  (children || []).forEach(function (c) {
    return addChild(c);
  });

  // console.log(children)

  last = el;
  return el;
};
var _default = dom;
exports["default"] = _default;