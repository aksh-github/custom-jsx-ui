// this is implemented based on https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76

// const log = console.log;
// const logt = console.time,
//   logte = console.timeEnd;
const noop = () => {};
const log = noop;
const logt = noop;
const logte = noop;

log("check https://github.com/pomber/incremental-rendering-demo");

// end meta

// publish as lib: https://www.youtube.com/watch?v=FITxnIDsMnw
// import { diff, patch } from "./vdom-yt";

let funcCache = {},
  altFuncCache = {};

const microframe = (() => {
  let currComp = null;

  let stack = [];
  let currMount = null,
    currUnmount = null;

  // vdom

  function df(props, ...children) {
    return children;
  }

  function h(type, props, ...children) {
    let _fn = null;
    let curParent;

    if (Array.isArray(children)) children = children.flat();

    if (typeof type === "function") {
      curParent = stack[stack.length - 1]?.n;
      // log("curre parent is", curParent, type.name);
      stack.push({ n: type?.name });

      const cacheKey = `${type.name}:${curParent}:${props?.key}`;

      setCurrComp(cacheKey);
      currComp = cacheKey;

      let rv = type(props, ...children);

      // if (altFuncCache) {
      // this is available in 24jun25 br in commented form

      funcCache[cacheKey] = {
        fname: type.name,
        // fn: _fn,
        mount: true,
        unMount: null,
        p: curParent,
        key: props?.key,
      };

      // if (props?.key !== undefined) callStack[counter].key = props.key;

      // counter++;

      // callStack[callStack.length - 1].p = stack[stack.length - 2]?.n;

      // b4
      // log(stack, callStack[callStack.length - 1]);

      // const rv =
      //   typeof _fn === "function" ? _fn({ ...props, children: children }) : _fn;

      setCurrComp(null);

      stack.pop();

      // if (stack[stack.length - 1]?.ch) stack[stack.length - 1].ch.push(popped);
      // else {
      //   // log(JSON.stringify(stack));
      //   // log(parChild);
      //   stack = [];
      // }

      // return { ...rv, $c: type.name, children: rv.children }; //perfect

      //complex node
      if (rv?.type) {
        // rv is frag
        // if (rv.type === "df") {
        //   // rv.props = { ...rv.props, _cc: rv?.children.length };
        //   props = { ...props, fragChildLen: rv?.children.length };
        // }

        return {
          ...rv,
          // props: rv.props,
          $c: type.name,
          // children: rv.children,
          children: [rv],
          // dont think its reqd
          // fragChildLen: rv?.children.length || undefined,
          $p: curParent,
          key: props?.key,
          props: props || {},
          type: "df",
        };
      }
      // str, null etc
      else if (Array.isArray(rv)) {
        console.warn(
          "Your component named `",
          type.name,
          "` is returning Array, manipulation to this Array is currently NOT supported and can lead to Unexpected behavior"
        );

        //special case return value Array and may be no type  (parent)
        return {
          $c: type.name,
          type: "df", //assign doc fragment type
          children: rv,
          $p: curParent,
        };
      }
      // return {
      //   $c: type.name,
      //   value: rv,
      //   $p: curParent,
      // };
      else {
        // there are 2 possiblities
        // 1. complex node but with no type

        if (rv?.$c) {
          // if (!rv.type) {
          //   rv.type = "df";
          // }
          return {
            $c: type.name,
            // value: rv,
            // ...rv,
            children: [rv],
            // type: "df", // sure that type is unavailable hence using df
            $p: curParent,
          };
        } else {
          // or 2. simple node
          return {
            $c: type.name,
            value: rv,
            props: props || {},
            $p: curParent,
          };
        }
      }
    }

    // log(children);

    // frag case
    if (type === "df") {
      let ct = children.length;
      // for (let i = 0; i < children.length; ++i) {
      //   if (children[i]?.type === "df") {
      //     ct += children[i]?.fragChildLen || 0;
      //   } else {
      //     ct += 1;
      //   }
      // }
      return {
        type,
        props: props || {},
        fragChildLen: ct,
        children,
      };
    } else
      return {
        // _c,
        type,
        props: props || {},
        // children: props?.ignoreNode ? [] : children,
        children:
          type?.includes("-") ||
          props?.ignoreNode ||
          type?.toLowerCase() === "iframe" ||
          type?.toLowerCase() === "template"
            ? []
            : children,
      };
  }

  return {
    h,
    df,
  };
})();

const dom = (() => {
  // mount n unmount
  let mountFns = [];

  function callUnmountAll() {
    const keysToReset = [];

    for (const key in altFuncCache) {
      if (!funcCache[key]) {
        altFuncCache[key].unMount?.();
        altFuncCache[key].unMount = null;

        delete altFuncCache[key];

        // reset(key);
        keysToReset.push(key);
      }
    }
    reset(keysToReset);
  }

  function callMountAll() {
    while (mountFns?.length) {
      // log(mountFns.pop());
      mountFns.pop()();
    }

    // if (len)
    init();
  }
  // dom helpers
  let rootNode = null;
  let curr = null;
  let old = null;

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
    return (
      isEventProp(name) ||
      name === "fragChildLen" ||
      // name === "ignoreNode" ||
      name === "fallback" ||
      name === "importFn" ||
      name === "error"
    );
  }

  function setProp($target, name, value) {
    // log(name, value);
    if (isCustomProp(name)) {
      return;
    } else if (name === "className") {
      $target.setAttribute("class", value);
    } else if (name === "style") {
      for (const sk in value) {
        $target.style[sk] = value[sk];
      }
    } else if (name === "ref") {
      value?.($target);
    } else if (name === "ignoreLater") {
      // $target["ignorenode"] = true;
      $target.setAttribute("ignorenode", true);
      $target.removeAttribute(name.toLowerCase());
    } else if (typeof value === "boolean") {
      setBooleanProp($target, name, value);
    } else {
      if (name === "value" || name === "htmlFor") {
        // special case
        $target[name] = value;

        // special handling for select
        setTimeout(() => {
          $target[name] = value;
        }, 0);
      }
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
    for (const name in props) {
      setProp($target, name, props[name]);
    }
  }

  function updateProp($target, name, newVal, oldVal) {
    if (!newVal && (newVal === undefined || newVal === null)) {
      removeProp($target, name, oldVal);
    } else if (isCustomProp(name)) {
      // if (isEventProp(name)) {
      //   if (name === "onSubmit") addEventListeners($target, { [name]: newVal });
      // }
    } else if (!oldVal || newVal !== oldVal) {
      setProp($target, name, newVal);
    }
  }

  function updateProps($target, newProps, oldProps = {}) {
    // if (newProps.ignoreNode || newProps.ignoreLater) {
    //   console.log($target, newProps);
    // }
    const props = Object.assign({}, newProps, oldProps);
    for (const name in props) {
      if (name === "onSubmit")
        addEventListeners($target, { [name]: newProps[name] });
      else updateProp($target, name, newProps[name], oldProps[name]);
    }
  }

  function addEventListeners($target, props) {
    for (const name in props) {
      if (isEventProp(name)) {
        const extratedName = extractEventName(name);

        // if (!eventListeners.has($target))
        //   eventListeners.set($target, new Set());
        if (!$target._events) $target._events = {};

        if ($target._events[`${extratedName}`]) {
          $target.removeEventListener(
            extratedName,
            $target._events[`${extratedName}`],
            true
          );
        }
        $target._events[`${extratedName}`] = props[name];
        $target.addEventListener(extratedName, props[name], true);
      }
    }
  }

  // vdom to dom

  const $d = document;
  // SVG

  const $sns = "http://www.w3.org/2000/svg";

  const createAndAppendSVG = (tag, attrs, ...children) => {
    function setPropsNS($target, props) {
      for (const name in props) {
        // setProp($target, name, props[name]);
        $target.setAttributeNS(null, name, props[name]);
      }
    }

    const element = $d.createElementNS($sns, "svg");
    // addAttributes(element, attrs);

    setPropsNS(element, attrs);

    for (const child of children) {
      const childElement = $d.createElementNS($sns, child.type);

      setPropsNS(childElement, child.props);

      // appendChild(element, childElement);
      element.appendChild(childElement);
    }

    return element;
  };

  // end SVG

  // Use requestIdleCallback to avoid blocking the main thread for large children arrays
  const appendChildren = (children, parent) => {
    let i = 0;
    const len = children.length;

    function processChunk(deadline) {
      const fragment = document.createDocumentFragment();
      while (i < len && deadline.timeRemaining() > 1) {
        fragment.appendChild(createElement(children[i]));
        i++;
      }
      if (fragment.childNodes.length > 0) {
        parent.appendChild(fragment);
      }
      if (i < len) {
        requestIdleCallback(processChunk);
      }
    }

    requestIdleCallback(processChunk);
  };

  function createElement(node) {
    if (!node?.type) {
      if (node?.$c) {
        // const tnode = $d.createTextNode(
        //   node?.value == null || node?.value == undefined ? "" : node?.value
        // );
        // return tnode;
        if (!node.children) {
          const tnode = $d.createTextNode(
            node?.value == null || node?.value == undefined ? "" : node?.value
          );
          return tnode;
        } else {
          return createElement(node.children[0]);
          // const childLen = node.children.length;

          // const $el2 = $d.createDocumentFragment();
          // for (let i = 0; i < childLen; ++i) {
          //   $el2.appendChild(createElement(node.children[i]));
          // }
          // return $el2;
        }
      } else
        return $d.createTextNode(node == null || node == undefined ? "" : node);
    }

    //special case Compo with Array return and no type (parent)
    // doc fragement case
    if (node?.type === "df") {
      // console.warn(
      //   "fragment support is experimental and nested fragments NOT supported!!!"
      // );
      const $el2 = $d.createDocumentFragment();

      // node.children.map(createElement).forEach($el2.appendChild.bind($el2));
      if (node.children.length > 100) {
        appendChildren(node.children, $el2);
      } else {
        for (let i = 0, len = node.children.length; i < len; ++i) {
          $el2.appendChild(createElement(node.children[i]));
        }
      }

      return $el2;
    }

    if (node.type === "svg") {
      return createAndAppendSVG(node.type, node.props, ...node.children);
    }

    const $el = $d.createElement(node.type);

    if (!node?.$c) {
      setProps($el, node.props);
      addEventListeners($el, node.props);
    }

    if (node.children.length > 100) {
      appendChildren(node.children, $el);
    } else {
      for (let i = 0, len = node.children.length; i < len; ++i) {
        $el.appendChild(createElement(node.children[i]));
      }
    }

    // node.children.map(createElement).forEach($el.appendChild.bind($el));

    return $el;
  }

  function changed(node1, node2) {
    // if both are compo nodes of type df
    if (node1?.type === node2?.type && node1?.type === "df") {
      return node1?.$c !== node2?.$c;
    } // they are dom nodes
    else
      return (
        // node1 != node2 ||
        typeof node1 !== typeof node2 ||
        // (typeof node1 === "string" && node1 !== node2) ||
        (!node1?.type && node1 !== node2) ||
        node1?.type !== node2?.type ||
        node1?.value !== node2?.value ||
        node1?.props?.name !== node2?.props?.name

        // || (node1?.props && node1.props.forceUpdate)
      );
  }

  // moved top
  // let rootNode = null;
  // let curr = null;
  // let old = null;

  // only 1st type (complete rewrite etc)

  function mount($root, initCompo) {
    rootNode = $root;
    // 0. for route change clean existing things
    // if (rootNode?.firstChild) {
    //   log(">>> this is route change");
    //   while (callStack?.length) {
    //     const fn = callStack.splice(callStack.length - 1, 1)?.[0];
    //     // log(fn);
    //     fn?.unMount?.();

    //     counter--;
    //   }
    // }
    curr = initCompo;
    // log(curr);
    // log(performance.now());
    old = curr(); // create latest vdom
    // log(performance.now());
    log(old);
    // log(funcCache);
    // 1. set dom
    // rootNode.appendChild(createElement(old));
    if (rootNode.firstChild)
      rootNode.replaceChild(createElement(old), rootNode.firstChild);
    else rootNode.appendChild(createElement(old));

    // log(callStack);
    callMountAll();

    altFuncCache = { ...funcCache };
    funcCache = {};
  }

  let patches = [],
    propsPatches = [];

  // all delta updates
  function forceUpdate() {
    // counter = 0; // v imp

    // log(performance.now());
    logt("TETVD");

    let current = curr(); // create latest vdom
    logte("TETVD");
    // log(old, current);
    // const oldStack = CompoIterator().iterate(old);
    // const currStack = CompoIterator().iterate(current);

    // log(CompoIterator().get(old, "TextArea"));

    // log(oldCallStack, callStack);
    // log(funcCache);

    // log(performance.now());

    // 1. call unmount before dom update
    // callUnmountAll();  // moved to setTimeout

    // log(performance.now());

    // 2. calculate diff
    patches = [];
    propsPatches = [];

    logt("TET");

    // diffElement(rootNode, current, old);
    wrapper(rootNode, current, old);

    // log(performance.now());

    // log("===================");

    let tout = setTimeout(() => {
      clearTimeout(tout);

      callUnmountAll();

      // 3. update dom
      // log(patches, propsPatches);
      // console.log(patches);
      if (propsPatches) applyPropsPatches(propsPatches);
      if (patches) applyPatches(patches);
      patches = propsPatches = null;
      // 3. trigger lifecycle
      // callLifeCycleHooks(callStack, oldStack);

      callMountAll();
      // log(callStack, oldStack);

      old = current;

      altFuncCache = { ...funcCache };
      // altFuncCache = structuredClone(funcCache);
      funcCache = {};

      logte("TET");
    }, 0);
    // requestAnimationFrame(() => {
    //   // 3. update dom
    //   log(patches);
    //   applyPatches(patches);
    //   patches = [];
    //   // 3. trigger lifecycle
    //   // callLifeCycleHooks(callStack, oldStack);

    //   callMountAll();
    //   // log(callStack, oldStack);

    //   // backup for future comparison
    //   oldCallStack = [...callStack];
    //   callStack = [];
    //   old = current;
    // });
  }

  function isValid(v) {
    return v !== undefined || v !== "";
  }

  // variation impl
  // 1. https://www.youtube.com/watch?v=l2Tu0NqH0qU and https://github.com/Matt-Esch/virtual-dom
  // 2. https://www.youtube.com/watch?v=85gJMUEcnkc

  const navigate = {
    routeChange: false,
    set: (flag) => {
      navigate.routeChange = flag;
    },
  };

  if (window)
    ["popstate", "navigate"].forEach((e) =>
      window.addEventListener(e, () => navigate.set(!0))
    );

  function wrapper($parent, newNode, oldNode, index = 0) {
    let stk = domListIterator(rootNode);

    let CTR = 0;
    let last = null;
    let optiPossible = false;
    let gdf = null;

    let _C = 0;

    if (navigate.routeChange) {
      updateComps.clear();
      navigate.set(false);
    }

    const updateCompsSize = updateComps.size;
    let currComp = null;
    let actualComparison = false;
    let comparisonsReqd = 0;
    let compareTill = 0;

    function diffElement($parent, newNode, oldNode, index = 0) {
      // if (!actualComparison && newNode?.type && oldNode?.type)
      //   return doMain(newNode, oldNode);
      if (!actualComparison && updateCompsSize) {
        if (newNode?.type && oldNode?.type) return doMain(newNode, oldNode);
        // if (newNode?.type === oldNode?.type) return;
        if (newNode === oldNode) return;
      }
      _C++;

      // log("compare: ", newNode);

      if (!isValid(oldNode)) {
        // if (oldNode?.type) {
        log("append: ");
        patches.push({ p: $parent, op: "APPEND", c: newNode });
      } else if (!isValid(newNode)) {
        // $parent.removeChild($parent.childNodes[index]);
        let el = $parent.childNodes[index];

        patches.push({
          p: $parent,
          op: "REMOVE",
          c: el,
        });

        if (el?.nodeType === 1) {
          while (CTR < stk.length) {
            CTR++;

            if (stk[CTR] === el) {
              const allChildLen = el.querySelectorAll("*").length;
              // log(CTR, " CTR BEFORE", stk[CTR]);
              // CTR += allChildLen;
              stk.splice(CTR, allChildLen);
              // log(CTR, " CTR AFTER", stk[CTR]);

              break;
            }
            // console.log(CTR, stk[CTR]);
          }
        }
        el = null;
        if (oldNode?.children) {
          old = oldNode.children = oldNode.props = null;
        }
      } else if (changed(newNode, oldNode)) {
        if (
          (newNode?.type === "df" && oldNode?.type === "df") ||
          (newNode?.type && oldNode?.type)
        ) {
          ++CTR;
          const dNode = stk[CTR];
          patches.push({
            p: dNode.parentNode,
            op: "REPLACE",
            c: [newNode, dNode],
          });

          if (dNode?.nodeType === 1) {
            while (CTR < stk.length) {
              if (dNode.contains(stk[CTR])) {
                // console.log("remove", stk[CTR]);
                // stk.splice(CTR, 1);
                CTR++;
              } else {
                // CTR--;
                break;
              }
            }
          }

          CTR--;
          // console.log(CTR, stk[CTR], stk);
        } else if ($parent?.childNodes[index]) {
          let el = $parent.childNodes[index];

          patches.push({
            p: $parent,
            op: "REPLACE",
            c: [newNode, el],
          });

          if (el?.nodeType === 1) {
            while (CTR < stk.length) {
              CTR++;

              if (stk[CTR] === el) {
                const allChildLen = el.querySelectorAll("*").length;
                // log(CTR, " CTR BEFORE", stk[CTR]);
                // CTR += allChildLen;
                stk.splice(CTR, allChildLen);
                // log(CTR, " CTR AFTER", stk[CTR]);

                break;
              }
              // console.log(CTR, stk[CTR]);
            }
          }

          // additoinal logic for frag modify. This changed on 2-sep
          const fragChildLen = oldNode?.fragChildLen;
          // for frag case remove additional as well
          if (oldNode?.type === "df" && fragChildLen) {
            // for (let i = 1; i < fragChildLen; ++i) {
            for (let i = fragChildLen - 1; i >= 1; --i) {
              // log("remove: ", $parent.childNodes[index + i]);
              // $parent?.removeChild($parent.childNodes[index + i]);
              patches.push({
                p: $parent,
                op: "REMOVE",
                c: $parent.childNodes[index + i],
              });
              // need to increment CTR as well 13-Dec
              CTR += 1;
            }
          }

          el = null;
        } else {
          //special case Compo with Array manipulation or no type (parent) for updating
          if ($parent?.appendChild) {
            // log("changed append: ");
            if (newNode?.type) {
              // its dom node
              // log("use df");
              if (optiPossible) {
                // gdf.appendChild(newEl);

                patches.push({
                  p: gdf,
                  op: "APPEND",
                  c: newNode,
                });
              } else {
                // $parent.appendChild(newEl);

                patches.push({
                  p: $parent,
                  op: "APPEND",
                  c: newNode,
                });
              }
            }

            // its text
            else {
              // $parent.textContent = newEl?.textContent;

              patches.push({
                p: $parent,
                op: "CONTENT",
                c: createElement(newNode)?.textContent,
              });
            }
          } else {
            // $parent?.parentNode?.appendChild(createElement(newNode));

            patches.push({
              p: $parent?.parentNode,
              op: "APPEND",
              c: newNode,
            });
          }
        }

        if (oldNode?.children) {
          old = oldNode.children = oldNode.props = null;
        }
      } else if (newNode?.type) {
        doMain(newNode, oldNode);
      }
    }

    function doMain(newNode, oldNode) {
      if (newNode?.type !== "df") {
        // genNode = genObj.next();

        CTR += 1;
      } else {
        // log(newNode.props, oldNode.props);

        currComp = `${newNode.$c}:${newNode.$p}:${newNode.key}`;
        let c = currComp.split(":")[0];

        if (
          // currComp === updateComp ||
          updateComps.has(currComp) ||
          newNode.$p === c ||
          newNode.key !== oldNode?.key
        ) {
          actualComparison = true;
        } else {
          // actualComparison = true;
          // if (!actualComparison) {
          //   // log("this must be due to context change");
          //   // if (newNode?.props?.context !== oldNode?.props?.context) {
          //   if (updateCtx.has(newNode?.props?.context)) {
          //     // log("context changed");
          //     actualComparison = true;
          //   }
          // }
        }
      }

      if (actualComparison && comparisonsReqd === 0) {
        // log(newNode.props);
        // log(CTR, stk, newNode);
        const { fragChildLen } = newNode;
        if (fragChildLen) {
          // CTR += 1;
          let qc = CTR + 1;

          for (let i = 0; i < fragChildLen; ++i) {
            let addThisMuch = 0;
            log("qc: ", qc);
            const el = stk[qc];
            // log(el);
            addThisMuch = el?.querySelectorAll("*").length || 0;
            comparisonsReqd += addThisMuch;
            qc += 1 + addThisMuch;
          }
          // log(
          //   "comparisonsReqd till: ",
          //   comparisonsReqd,
          //   stk[CTR + fragChildLen + comparisonsReqd]
          // );
          compareTill = CTR + fragChildLen + comparisonsReqd + 1;
        } else {
          comparisonsReqd += stk[CTR + 1]?.querySelectorAll("*").length || 0;
          // log("comparisonsReqd till: ", stk[CTR + comparisonsReqd + 1]);
          compareTill = CTR + comparisonsReqd + 1;
        }
      }

      // if (
      //   newNode?.props?.importFn ||
      //   (newNode?.props?.cacheKey && !newNode?.props?.fetch)
      // ) {
      //   // CTR += 1;
      // }

      const domNode = stk[CTR];

      if (CTR === compareTill + 1) {
        actualComparison = false;
        comparisonsReqd = 0;
        compareTill = 0;
      }

      if (last !== domNode) {
        // updateProps(domNode, newNode.props, oldNode.props);
        // this is available in 24jun25 br in commented form

        if (newNode?.props?.ignoreNode) return;

        // dont enable below condition
        if (actualComparison) {
          if (
            oldNode.type === newNode.type &&
            propsChanged(oldNode.props, newNode.props)
          )
            propsPatches.push({
              $target: domNode,
              newProps: newNode.props,
              oldProps: oldNode.props,
            });
        }

        last = domNode;
      }

      // if (newNode?.props?.cacheKey) {
      // this is available in 24jun25 br in commented form

      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;

      if (newLength > 100) {
        optiPossible = true;
        gdf = $d.createDocumentFragment();
        log("have for loop custom component or see how this can be optimized");
      }

      if (newLength + oldLength === 0) {
      } else if (newLength === 0) {
        // log(domNode, stk, CTR);
        const toSkip = domNode.querySelectorAll("*").length;
        CTR += toSkip;
        stk.splice(CTR, CTR + toSkip);

        patches.push({
          p: domNode,
          op: "REMOVEALL",
        });

        if (oldNode?.children) {
          old = oldNode.children = oldNode.props = null;
        }
      }
      // else if (oldLength === 0) {
      //   log("** APPEND: This is NOT BENEFICIAL");
      //   const df = $d.createDocumentFragment();

      //   for (let i = 0; i < newLength; ++i)
      //     patches.push({
      //       p: df,
      //       op: "APPEND",
      //       c: createElement(newNode.children[i]),
      //     });

      //   patches.push({ p: domNode, op: "APPEND", c: df });
      // }
      else {
        for (let i = 0; i < newLength || i < oldLength; i++) {
          // if (newNode.type === "df" && oldNode.type === "df") {
          //   doMain(newNode.children[i], oldNode.children[i]);
          // } else {
          //   diffElement(domNode, newNode.children[i], oldNode.children[i], i);
          // }
          diffElement(domNode, newNode.children[i], oldNode.children[i], i);
        }
      }

      if (optiPossible) {
        // log("after for", domNode);
        // domNode.appendChild(gdf);

        patches.push({
          p: domNode,
          op: "APPENDDF",
          c: gdf,
        });

        optiPossible = false;
        gdf = null;
      }
    }

    diffElement($parent, newNode, oldNode, index);

    last = gdf = null;
    stk.length = 0;

    updateComps.clear();
    // updateCtx.clear();

    log(_C);
    _C = 0;
  }

  function applyPropsPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();

      updateProps(patch.$target, patch.newProps, patch.oldProps);

      patch.$target = null;
      patch.newProps = null;
      patch.oldProps = null;
      // patch = null;
    }
    patches.length = 0;
  }

  function applyPatches(patches) {
    const disposalPromises = [];

    while (patches.length) {
      const patch = patches.shift();

      switch (patch.op) {
        case "APPENDDF":
          patch.p.appendChild(patch.c);
          break;
        case "APPEND":
          patch.p.appendChild(createElement(patch.c));
          break;

        case "REMOVE":
          patch.p.removeChild(patch.c);
          disposalPromises.push(disposeNodes(patch.c));
          break;

        case "REMOVEALL":
          const childrenToDispose = Array.from(patch.p.childNodes);
          disposalPromises.push(
            Promise.all(childrenToDispose.map((c) => disposeNodes(c)))
          );

          if (patch.p.replaceChildren) {
            patch.p.replaceChildren();
          } else {
            while (patch.p.firstChild) {
              patch.p.removeChild(patch.p.firstChild);
            }
          }
          break;

        case "REPLACE":
          patch.p.replaceChild(createElement(patch.c[0]), patch.c[1]);
          disposalPromises.push(disposeNodes(patch.c[1]));
          break;

        case "CONTENT":
          patch.p.textContent = patch.c;
          break;
      }

      patch.p = patch.c = null;
    }

    patches.length = 0;

    // Cleanup all references after all disposals complete
    if (disposalPromises.length > 0) {
      Promise.all(disposalPromises)
        .catch((err) => log("Error during node disposal:", err))
        .finally(() => {
          disposalPromises.length = 0;
        });
    }
  }

  const disposeNodes = async (node) => {
    // let domList = domListIterator(node);

    // for (let i = domList.length - 1; i > -1; i--) {
    //   eventListenerInst.unregisterEventListener(domList[i]);
    //   // domList[i] = null;

    //   if (i % 50 === 0) {
    //     await yieldToMain();
    //   }
    // }

    // domList = node = null;

    // new

    // Use iteration instead of recursion
    const nodeStack = [node];

    while (nodeStack.length > 0) {
      let current = nodeStack.pop();

      if (!current) continue;

      // if (
      //   current.getAttribute &&
      //   current.getAttribute("ignorenode") === "true"
      // ) {
      //   continue;
      // }

      // Clean up event listeners
      // eventListenerInst.unregisterEventListener(current);
      if (current && current._events) {
        for (const evt in current._events) {
          current.removeEventListener(evt, current._events[evt], true);
        }
        current._events = null;
      }

      // Add children to stack
      if (current.childNodes) {
        for (let i = current.childNodes.length - 1; i >= 0; i--) {
          nodeStack.push(current.childNodes[i]);
          if (i % 50 === 0) {
            await yieldToMain();
          }
        }
      }

      // Clear references
      // current.nodeValue = null;
      current?.remove?.();

      current = null;
    }

    // Clear final references

    node = null;
    nodeStack.length = 0;

    // end
  };

  function propsChanged(oldProps, newProps) {
    if (oldProps === newProps) return false;
    if (!oldProps || !newProps) return true;

    const oldKeys = Object.keys(oldProps);
    if (oldKeys.length !== Object.keys(newProps).length) return true;

    for (let i = 0; i < oldKeys.length; i++) {
      const key = oldKeys[i];
      if (!(key in newProps) || oldProps[key] !== newProps[key]) {
        return true;
      }
    }
    return false;
  }

  function isWebComponent(element) {
    // Check if the tag name includes a hyphen
    return element.tagName.includes("-");
  }

  ///////////////
  // alternate 1 (non recursive) for walkDom // tested and works
  // inspired by: https://www.youtube.com/watch?v=3nwupG2Joaw
  function domListIterator(_rootNode) {
    // pass rootNode if its not global
    // log(next);
    let arr = [_rootNode];
    let next = _rootNode;

    function iterChild() {
      while (next) {
        // log(next);
        // arr.push(next);
        // const notToSkip = !next.getAttribute("ignorenode");
        const notToSkip = !(
          next?.getAttribute("ignorenode") ||
          next.tagName === "IFRAME" ||
          isWebComponent(next)
        );

        if (next.firstElementChild && notToSkip) {
          next = next.firstElementChild;
          // log(next);
          arr.push(next);
        } else {
          iterSibling();
        }
      }
    }

    function iterSibling() {
      while (next) {
        if (next.nextElementSibling) {
          next = next.nextElementSibling;

          // log(next);
          arr.push(next);
          return;
        }

        next = next.parentElement;

        if (next === _rootNode) {
          next = null;
        }
      }
    }

    iterChild();
    next = _rootNode = null;
    return arr;
  }

  function yieldToMain() {
    if (globalThis.scheduler?.yield) {
      return scheduler.yield();
    }

    // Fall back to yielding with setTimeout.
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  return {
    mount,
    forceUpdate,
    createElement,
  };
})();

import { Lazy as _lazy } from "./lazy";
import { memo as _memo } from "./memo";

// export const onMount = microframe.onMount;
// export const onCleanup = microframe.onCleanup;
export const h = microframe.h;
export const df = microframe.df;

export const mount = dom.mount;
export const forceUpdate = dom.forceUpdate;
export const createElement = dom.createElement;

// other helpful Components
export const Lazy = _lazy;
export const memo = _memo;

// state import exports

import { init, reset, setCurrComp, updateComps } from "../simple-state";

// export const createState = _createState;
export {
  createEffect,
  createState,
  createContext,
  skipUpdate,
  batch,
  smartRegisterCallback,
} from "../simple-state";

// inspired by https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-3-react-suspense-and-concurrent-mode-5da8c12aed3f

// export function SuspenseV2(props, child) {
// This function is still available in 24jun25 br in commented form
