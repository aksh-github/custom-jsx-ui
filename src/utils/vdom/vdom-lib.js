export function onMount() {}

export function onCleanup() {}

let callStack = [];
let counter = 0;

export function h(type, props, ...children) {
  let _fn = null;

  if (Array.isArray(children)) children = children.flat();

  if (typeof type === "function") {
    if (callStack[counter]?.fname !== type.name) {
      console.log(type.name, " not found");

      // const callStackLen = callStack.length;
      // callStack.splice(counter, callStackLen - counter);

      // const ar = unMountArr.splice(counter, callStackLen - counter);
      // ar?.reverse().forEach((fn) => {
      //   fn?.();
      // });

      _fn = type(props, ...children);
      callStack.push({ fname: type.name, fn: _fn });

      // console.log(unMountArr[counter]);
    } else {
      _fn = callStack[counter].fn;

      // console.log(unMountArr[counter]);
    }
    counter++;
    const rv = _fn({ ...props, children: children });

    // console.log(rv);

    // return { ...rv, $c: type.name, children: rv.children }; //perfect

    //complex node
    if (rv?.type) return { ...rv, $c: type.name, children: rv.children };
    // str, null etc
    else
      return {
        $c: type.name,
        value: rv,
      };
  }

  // console.log(children);

  return {
    // _c,
    type,
    props: props || {},
    children,
  };
}

// export function h(type, props, ...children) {
//   let _fn = null;

//   children = children.flat();

//   if (typeof type === "function") {
//     _c = type.name;

//     if (callStack[counter]?.fname !== type.name) {
//       console.log(type.name, " not found");

//       // const callStackLen = callStack.length;
//       // callStack.splice(counter, callStackLen - counter);

//       // const ar = unMountArr.splice(counter, callStackLen - counter);
//       // ar?.reverse().forEach((fn) => {
//       //   fn?.();
//       // });

//       _fn = type(props, ...children);
//       callStack.push({ fname: type.name, fn: _fn });

//       // console.log(unMountArr[counter]);
//     } else {
//       _fn = callStack[counter].fn;
//       // console.log(unMountArr[counter]);
//     }
//     counter++;
//     return _fn({ ...props, children: children }, children);
//   }

//   return {
//     _c,
//     type,
//     props: props || {},
//     children,
//   };
// }

function setBooleanProp($target, name, value) {
  if (value) {
    $target.setAttribute(name, value);
    $target[name] = true;
  } else {
    $target[name] = false;
  }
}

function removeBooleanProp($target, name) {
  $target.removeAttribute(name);
  $target[name] = false;
}

function isEventProp(name) {
  return /^on/.test(name);
}

function extractEventName(name) {
  return name.slice(2).toLowerCase();
}

function isCustomProp(name) {
  return isEventProp(name) || name === "forceUpdate";
}

function setProp($target, name, value) {
  // console.log(name, value);
  if (isCustomProp(name)) {
    return;
  } else if (name === "className") {
    $target.setAttribute("class", value);
  } else if (name === "style") {
    Object.keys(value).forEach((sk) => {
      $target.style[sk] = value[sk];
    });
  } else if (name === "ref") {
    value?.($target);
  } else if (typeof value === "boolean") {
    setBooleanProp($target, name, value);
  } else {
    $target.setAttribute(name, value);
  }
}

function removeProp($target, name, value) {
  if (isCustomProp(name)) {
    return;
  } else if (name === "className") {
    $target.removeAttribute("class");
  } else if (typeof value === "boolean") {
    removeBooleanProp($target, name);
  } else {
    $target.removeAttribute(name);
  }
}

function setProps($target, props) {
  Object.keys(props).forEach((name) => {
    setProp($target, name, props[name]);
  });
}

function updateProp($target, name, newVal, oldVal) {
  if (!newVal) {
    removeProp($target, name, oldVal);
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal);
  }
}

function updateProps($target, newProps, oldProps = {}) {
  const props = Object.assign({}, newProps, oldProps);
  Object.keys(props).forEach((name) => {
    updateProp($target, name, newProps[name], oldProps[name]);
  });
}

function addEventListeners($target, props) {
  Object.keys(props).forEach((name) => {
    if (isEventProp(name)) {
      $target.addEventListener(extractEventName(name), props[name]);
    }
  });
}

function createElement(node) {
  if (node?.$c) {
    console.log("call mount for >>>>", node.$c);
  }

  if (!node?.type) {
    if (node?.$c)
      return document.createTextNode(
        node?.value == null || node?.value == undefined ? "" : node?.value
      );
    else
      return document.createTextNode(
        node == null || node == undefined ? "" : node
      );
  }

  const $el = document.createElement(node.type);
  setProps($el, node.props);
  addEventListeners($el, node.props);
  node.children.map(createElement).forEach($el.appendChild.bind($el));

  return $el;
}

function changed(node1, node2) {
  return (
    node1 == node2 ||
    typeof node1 !== typeof node2 ||
    // (typeof node1 === "string" && node1 !== node2) ||
    (!node1?.type && node1 !== node2) ||
    node1?.type !== node2?.type ||
    (node1.props && node1.props.forceUpdate)
  );
}

function CompoIterator() {
  let temp = [];

  function iterate(o) {
    if (o?.$c) {
      temp.push(o.$c);
      if (o?.children) {
        o.children.forEach((_o) => {
          iterate(_o);
        });
      }
      // console.log(o.$c);

      // console.log(temp);
      return [...temp];
    }
  }

  return {
    iterate: iterate,
  };
}

let rootNode = null;
let curr = null;
let old = null;

export function mount($root, initCompo) {
  rootNode = $root;
  curr = initCompo;
  // console.log(curr);
  old = curr(); // create latest vdom
  // CompoIterator().iterate(old);
  console.log(old);
  // updateElement(rootNode, old);
  rootNode.appendChild(createElement(old));
}

export function forceUpdate() {
  // oldStack = [...callStack];
  counter = 0;
  // callStack = [];
  let current = curr(); // create latest vdom
  console.log(old, current);
  // const olda = CompoIterator().iterate(old);
  // const curra = CompoIterator().iterate(current);
  // console.log(olda, curra);
  updateElement(rootNode, current, old);
  old = current;
}

function isValid(v) {
  return v !== undefined || v !== "";
}

// export function updateElement($parent, newNode, oldNode, index = 0) {
//   if (!oldNode) {
//     // if (oldNode?.type) {
//     $parent.appendChild(createElement(newNode));
//   } else if (!newNode) {
//     $parent.removeChild($parent.childNodes[index]);
//   } else if (changed(newNode, oldNode)) {
//     $parent.replaceChild(createElement(newNode), $parent.childNodes[index]);
//   } else if (newNode.type) {
//     updateProps($parent.childNodes[index], newNode.props, oldNode.props);
//     const newLength = newNode.children.length;
//     const oldLength = oldNode.children.length;
//     for (let i = 0; i < newLength || i < oldLength; i++) {
//       updateElement(
//         $parent.childNodes[index],
//         newNode.children[i],
//         oldNode.children[i],
//         i
//       );
//     }
//   }
// }

export function updateElement($parent, newNode, oldNode, index = 0) {
  if (!isValid(oldNode)) {
    // if (oldNode?.type) {
    $parent.appendChild(createElement(newNode));
  } else if (!isValid(newNode)) {
    $parent.removeChild($parent.childNodes[index]);
  } else if (changed(newNode, oldNode)) {
    // if (newNode != oldNode)
    //   console.log(newNode, oldNode);
    $parent.replaceChild(createElement(newNode), $parent.childNodes[index]);
  } else if (newNode.type) {
    updateProps($parent.childNodes[index], newNode.props, oldNode.props);
    const newLength = newNode.children.length;
    const oldLength = oldNode.children.length;
    for (let i = 0; i < newLength || i < oldLength; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      );
    }
  }
}
