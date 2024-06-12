// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

let callStack = [];
let counter = 0;

let currMount = null,
  currUnmount = null;

export function onMount(cb) {
  // console.log(callStack[counter]);
  currMount = cb;
}

export function onCleanup(cb) {
  // console.log(callStack[counter]);
  currUnmount = cb;
}

export function h(type, props, ...children) {
  let _fn = null;

  if (Array.isArray(children)) children = children.flat();

  if (typeof type === "function") {
    if (callStack[counter]?.fname !== type.name) {
      console.log(type.name, " not found");

      // unmount-logic
      // console.log(callStack[counter]?.unMount);
      callStack[counter]?.unMount?.();

      if (callStack[counter]) callStack[counter].unMount = null;

      // end unmount-logic

      _fn = type(props, ...children);
      // callStack.push({ fname: type.name, fn: _fn });
      // console.log("call unmount for ", callStack[counter]?.fname);
      callStack[counter] = {
        fname: type.name,
        fn: _fn,
        mount: currMount,
        unMount: currUnmount,
      };
      currMount = currUnmount = null; // v imp step

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
    else if (Array.isArray(rv)) {
      //special case Compo with Array return and no type  (parent)
      return {
        $c: type.name,
        type: "df", //assign doc fragment type
        children: rv,
      };
    } else
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
  // if (node?.$c) {
  //   console.log("call mount for >>>>", node.$c);
  // }

  if (!node?.type) {
    if (node?.$c) {
      const tnode = document.createTextNode(
        node?.value == null || node?.value == undefined ? "" : node?.value
      );
      // console.log("call mount for >>>>", node.$c);
      // callStack[counter]?.mount?.();
      // counter++;
      return tnode;
    } else
      return document.createTextNode(
        node == null || node == undefined ? "" : node
      );
  }

  //special case Compo with Array return and no type (parent)
  // doc fragement case
  if (node?.type === "df") {
    const $el2 = document.createDocumentFragment();

    node.children.map(createElement).forEach($el2.appendChild.bind($el2));

    return $el2;
  }

  const $el = document.createElement(node.type);
  setProps($el, node.props);
  addEventListeners($el, node.props);
  if (node?.$c) {
    // console.log("call mount for >>>>", node.$c);
    // callStack[counter]?.mount?.();
    // counter++;
  }
  node.children.map(createElement).forEach($el.appendChild.bind($el));

  return $el;
}

function changed(node1, node2) {
  return (
    // node1 != node2 ||
    typeof node1 !== typeof node2 ||
    // (typeof node1 === "string" && node1 !== node2) ||
    (!node1?.type && node1 !== node2) ||
    node1?.type !== node2?.type
    // || (node1?.props && node1.props.forceUpdate)
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
    } else if (o?.children) {
      o.children.forEach((_o) => {
        iterate(_o);
      });
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
  // 0. for route change clean existing things
  if (rootNode?.firstChild) {
    console.log(">>> this is route change");
    while (callStack?.length) {
      const fn = callStack.splice(callStack.length - 1, 1)?.[0];
      // console.log(fn);
      fn?.unMount?.();

      counter--;
    }
  }
  curr = initCompo;
  // console.log(curr);
  old = curr(); // create latest vdom
  console.log(old);
  // updateElement(rootNode, old);
  // 1. set dom
  // rootNode.appendChild(createElement(old));
  if (rootNode.firstChild)
    rootNode.replaceChild(createElement(old), rootNode.firstChild);
  else rootNode.appendChild(createElement(old));

  // 2. trigger lifecycle
  callMountAll();
}

export function forceUpdate() {
  counter = 0; // v imp
  // callStack = [];
  let current = curr(); // create latest vdom
  console.log(old, current);
  const oldStack = CompoIterator().iterate(old);
  const currStack = CompoIterator().iterate(current);

  // 1. update dom
  updateElement(rootNode, current, old);
  // 2. trigger lifecycle
  callLifeCycleHooks(callStack, oldStack);

  // backup for future comparison
  old = current;
}

function callMountAll() {
  for (let i = 0; i < counter; ++i) {
    // console.log(callStack[i]);
    callStack[i]?.mount?.();
    // need to check carefully
    callStack[i].mount = null;
  }
}

function callLifeCycleHooks(callStack, stack) {
  // unmount-logic (this is getting done h func itself)
  // for (let i = 0; i < stack.length; ++i) {
  //   if (stack[i] !== callStack[i]?.fname) {
  //     console.log("unmount reqd for >> ", stack[i]);
  //     // callStack[i]?.unMount?.();
  //     // callStack[i].unMount = null;
  //   }
  // }

  // correct
  for (let i = counter; i < callStack.length; ++i) {
    // console.log("unmount reqd for >> ", callStack[i]?.fname);
    callStack[i]?.unMount?.();
    callStack[i].unMount = null;
  }

  // v imp step
  if (counter < callStack.length)
    callStack.splice(counter, callStack.length - counter);

  // mount-logic

  for (let i = 0; i < counter; ++i) {
    callStack[i]?.mount?.();
    callStack[i].mount = null;
  }
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
    console.log(typeof $parent.childNodes[index]);

    if ($parent.childNodes[index])
      $parent.replaceChild(createElement(newNode), $parent.childNodes[index]);
    else {
      //special case Compo with Array return and no type (parent) for updating
      $parent?.parentNode?.appendChild(createElement(newNode));
    }
  } else if (newNode?.type) {
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
