const microframe = (() => {
  let stack = [];

  let callStack = [];
  let counter = 0;

  let oldCallStack = []; // copy of callStack to see cached results
  const ArrIterator = (_from) => {
    let from = _from || 0;

    return {
      get: () => {
        // console.log(from);
        const rv = { curr: oldCallStack[from], idx: from };
        from++;
        return rv;
      },
      reset: (_from) => {
        from = _from || 0;
      },
    };
  };
  let iter;

  // mount n unmount

  let currMount = null,
    currUnmount = null;

  function onMount(cb) {
    // console.log(counter, cb);
    currMount = cb;
  }

  function onCleanup(cb) {
    // console.log(callStack[counter]);
    currUnmount = cb;
  }

  function callUnmountAll() {
    let len = oldCallStack.length;
    let clen = callStack.length;

    for (let i = 0; i < len; ++i) {
      let found = false;
      for (let j = 0; j < clen; ++j) {
        if (
          oldCallStack[i].fname === callStack[j].fname &&
          oldCallStack[i].p === callStack[j].p
        ) {
          found = true;
          break;
        } else {
        }
      }

      if (!found) {
        // console.log("call unmount for ", oldCallStack[i].fname);
        oldCallStack[i]?.unMount?.();
        oldCallStack[i].unMount = null;
      }
    }
  }

  function callMountAll() {
    let len = callStack.length;
    for (let i = 0; i < len; ++i) {
      // console.log(callStack[i]);
      callStack[i]?.mount?.();
      // need to check carefully
      callStack[i].mount = null;
    }
  }

  const createDom = (type, props, ...children) => {
    const el = document.createElement(type);
    //   el.dataset.id = ctr++;
    Object.keys(props || {}).forEach((k) => {
      if (k === "style") {
        Object.keys(props[k]).forEach((sk) => {
          el.style[sk] = props[k][sk];
        });
      } else {
        // el[k] = props[k]
        if (k?.startsWith("on")) {
          const evtName = k.replace(/on/, "").toLowerCase();
          el.addEventListener(evtName, props[k]);
        } else if (k?.startsWith("data")) {
          el.setAttribute(k, props[k]);
        } else if (k === "ref") {
          props[k]?.(el);
        } else {
          el[k] = props[k];
        }
        // console.log('spl handling for: ', k)
      }
    });

    const addChild = (child) => {
      if (Array.isArray(child)) {
        child.forEach((c) => addChild(c));
      } else if (typeof child === "object" && child != null) {
        el.appendChild(child);
      } else {
        el.appendChild(document.createTextNode(child));
      }
    };

    (children || []).forEach((c) => addChild(c));

    return el;
  };

  const domv2 = (type, props, ...children) => {
    // console.log(type, props, children);

    if (!type) return null;

    let _fn = null;
    let curParent;

    if (Array.isArray(children)) children = children.flat();

    if (typeof type === "function") {
      curParent = stack[stack.length - 1]?.n;
      stack.push({ n: type?.name });

      if (oldCallStack?.length) {
        const exisng = iter.get();

        if (
          type.name == exisng?.curr?.fname &&
          curParent == exisng?.curr?.p &&
          props?.key === exisng?.curr?.key
        ) {
          // console.log("matched for ", exisng);
          // iter.reset(exisng.idx);
          _fn = exisng.curr.fn;
          currMount = exisng.curr.mount;
          currUnmount = exisng.curr.unMount;
        } else {
          let j = exisng.idx + 1;
          let found = false;
          iter.reset(j);
          for (; j < oldCallStack.length; ++j) {
            const exisng2 = iter.get();
            // if (exisng2?.curr == null) break;
            // console.log(
            //   type.name,
            //   exisng2?.curr?.fname,
            //   type.name == exisng2?.curr?.fname ?? "matched"
            // );
            if (
              type.name == exisng2?.curr?.fname &&
              curParent == exisng2?.curr?.p
            ) {
              iter.reset(exisng2.idx); //next search should start from here
              found = true;

              _fn = exisng2.curr.fn;
              currMount = exisng2.curr.mount;
              currUnmount = exisng2.curr.unMount;
              break;
            }
          }
          if (!found) {
            // reset to whatever last found idx
            iter.reset(exisng.idx);
            _fn = type(props, ...children);
          }
        }
      } else {
        _fn = type(props, ...children);
      }

      callStack[counter] = {
        fname: type.name,
        fn: _fn,
        mount: currMount,
        unMount: currUnmount,
        p: curParent,
      };

      if (props?.key !== undefined) callStack[counter].key = props.key;

      currMount = currUnmount = null;

      counter++;

      const rv =
        typeof _fn === "function" ? _fn({ ...props, children: children }) : _fn;

      // console.log(rv);
      stack.pop();

      return rv;
    } else {
      return createDom(type, props, ...children);
    }
  };

  function _renderUtils() {
    let Main = null,
      rootNode = null;
    let oldc;

    const render = (_node, _Main) => {
      // reset all callstack
      // calls unmount for all as well
      // lc.reset(true);

      rootNode = _node;
      Main = _Main;
      // imp step: set the latest state
      // oldc = Main();
      oldc = microframe.domv2(Main);

      if (oldc == null || oldc == undefined || typeof oldc === "string") {
        oldc = document.createTextNode(oldc);
      } else if (typeof oldc === "number") {
        oldc = document.createTextNode(oldc.toString());
      }

      if (rootNode.firstChild) rootNode.replaceChild(oldc, rootNode.firstChild);
      else rootNode.appendChild(oldc);

      // call mount for all
      callMountAll();

      iter = ArrIterator();
      oldCallStack = [...callStack];
      callStack = [];

      // console.log(oldCallStack, callStack);

      return oldc;
    };

    const forceUpdate = () => {
      counter = 0; // v imp

      console.log(oldc);

      // callStack = [];
      iter = ArrIterator();

      console.log(performance.now());

      const newc = domv2(Main);
      const diffs = computeDiff(oldc, newc);

      console.log(diffs);

      callUnmountAll();

      applyPatchv2(rootNode.firstChild, diffs);

      console.log(performance.now());

      // call mount for all
      callMountAll();

      // backup for future comparison
      oldCallStack = [...callStack];
      callStack = [];
      oldc = newc;
    };

    return { render, forceUpdate };
  }

  const microPatch = (compName, existNode) => {
    console.log(oldCallStack, callStack);

    oldCallStack.forEach((item) => {
      if (item.fname == compName) {
        // item.fn = null;
        const newNode = item.fn();
        // console.log(computeDiff(existNode, newNode));
        const diffs = computeDiff(existNode, newNode);
        console.log(diffs);
        applyPatchv2(existNode, diffs);
        // existNode = newNode;

        renderUtils.forceUpdate();
      }
    });
  };

  return {
    domv2,
    onMount,
    onCleanup,
    // callMountAll,
    // ArrIterator,
    _renderUtils,
    microPatch,
  };
})();

// export const mount = microframe.mount;
export const domv2 = microframe.domv2;
export const forceUpdate = microframe.forceUpdate;
export const onMount = microframe.onMount;
export const onCleanup = microframe.onCleanup;
export const microPatch = microframe.microPatch;

export const renderUtils = microframe._renderUtils();

// version 2

// Function to compute the diff between two DOM nodes
export function computeDiff(node1, node2) {
  const diffs = [];

  function walk(node1, node2, path) {
    if (!node1 && node2) {
      diffs.push({ type: "ADD", path, node: node2.cloneNode(true) });
    } else if (node1 && !node2) {
      diffs.push({ type: "REMOVE", path });
    } else if (
      node1.nodeType !== node2.nodeType ||
      node1.nodeName !== node2.nodeName
    ) {
      diffs.push({ type: "REPLACE", path, node: node2.cloneNode(true) });
      // diffs.push({ type: "REMOVE", path });
      // diffs.push({ type: "ADD", path, node: node2.cloneNode(true) });
    } else if (
      node1.nodeType === Node.TEXT_NODE &&
      node1.nodeValue !== node2.nodeValue
    ) {
      diffs.push({ type: "TEXT", path, value: node2.nodeValue });
    } else {
      // Check for attribute differences
      if (node1.nodeType === Node.ELEMENT_NODE) {
        const attrs1 = node1.attributes;
        const attrs2 = node2.attributes;
        const attrDiffs = [];

        for (let i = 0; i < attrs1.length; i++) {
          const attr1 = attrs1[i];
          const attr2 = attrs2.getNamedItem(attr1.name);
          if (!attr2 || attr1.value !== attr2.value) {
            attrDiffs.push({
              name: attr1.name,
              value: attr2 ? attr2.value : null,
            });
          }
        }

        for (let i = 0; i < attrs2.length; i++) {
          const attr2 = attrs2[i];
          if (!attrs1.getNamedItem(attr2.name)) {
            attrDiffs.push({ name: attr2.name, value: attr2.value });
          }
        }

        if (node1.tagName === "INPUT" || node1.tagName === "TEXTAREA") {
          if (node1.value !== node2.value) {
            diffs.push({
              type: "PROP",
              path,
              name: "value",
              value: node2.value,
            });
          }
        }

        if (attrDiffs.length > 0) {
          diffs.push({ type: "ATTR", path, attrs: attrDiffs });
        }
      }

      const children1 = Array.from(node1.childNodes);
      const children2 = Array.from(node2.childNodes);
      const maxLength = Math.max(children1.length, children2.length);

      for (let i = 0; i < maxLength; i++) {
        walk(children1[i], children2[i], path.concat(i));
      }
    }
  }

  walk(node1, node2, []);
  return diffs;
}

export function getPath(node, target) {
  const fpath = [];

  function walk(node, path) {
    if (node === target) {
      console.log(node, " got it");
      console.log(path);
      fpath.push(path);
      // return path;
    }

    const children1 = node.childNodes;

    for (let i = 0; i < children1.length; i++) {
      walk(children1[i], path.concat(i));

      // console.log(node);
    }
  }

  walk(node, []);

  return fpath[0];
}

// Function to apply a patch to a DOM tree
export function applyPatchv2(root, diffs) {
  diffs.forEach((diff) => {
    const { type, path, node, value, attrs } = diff;
    const parent = path
      .slice(0, -1)
      .reduce((acc, index) => acc.childNodes[index], root);
    const index = path[path.length - 1];

    // if (index === undefined || index === null) return;

    switch (type) {
      case "ADD":
        if (index === undefined || index === null) root.appendChild(node);
        else parent.appendChild(node);
        break;
      case "REMOVE":
        if (index === undefined || index === null) root.remove();
        else parent.removeChild(parent.childNodes[index]);
        break;
      case "REPLACE":
        if (index === undefined || index === null)
          root.parentNode.replaceChild(node, parent);
        else parent.replaceChild(node, parent.childNodes[index]);
        break;
      case "TEXT":
        if (index === undefined || index === null) root.nodeValue = value;
        else parent.childNodes[index].nodeValue = value;
        break;
      case "ATTR":
        const targetNode =
          index === undefined || index === null
            ? root
            : parent.childNodes[index];
        attrs.forEach((attr) => {
          if (attr.value === null) {
            targetNode.removeAttribute(attr.name);
          } else {
            targetNode.setAttribute(attr.name, attr.value);
          }
        });
      case "PROP": // for inputs etc
        const targetElement =
          index === undefined || index === null
            ? root
            : parent.childNodes[index];
        targetElement.value = value;
        break;
    }
  });
}

// end version 2
