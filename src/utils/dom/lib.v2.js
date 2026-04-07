import { setCurrComp, updateComps } from "../signal-complex";

const TEXT_ELEMENT = "TEXT_ELEMENT";

// Per-mount-point state tracking
const mountPoints = new Map();
let currentMountContainer = null;
let mountIdCounter = 0;
const containerToId = new WeakMap();
const mountIdToContainer = new Map();

function getMountId(container) {
  if (!containerToId.has(container)) {
    const mountId = `m${mountIdCounter++}`;
    containerToId.set(container, mountId);
    mountIdToContainer.set(mountId, container);
  }
  return containerToId.get(container);
}

function getMountState(container) {
  if (!mountPoints.has(container)) {
    mountPoints.set(container, {
      rootVNode: null,
      renderedVNode: null,
      hookStates: [],
      delegatedListeners: new Map(),
    });
  }
  return mountPoints.get(container);
}

function setCurrentMount(container) {
  currentMountContainer = container;
}

function flattenChildren(children) {
  const flat = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      flat.push(...flattenChildren(child));
      continue;
    }

    if (
      child === null ||
      child === undefined ||
      child === false ||
      child === true
    ) {
      continue;
    }

    if (typeof child === "string" || typeof child === "number") {
      flat.push(createTextElement(String(child)));
      continue;
    }

    flat.push(child);
  }

  return flat;
}

function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function h(type, props, ...children) {
  return {
    type,
    props: {
      ...(props || {}),
      children: flattenChildren(children),
    },
  };
}

function isEventProp(key) {
  return key.startsWith("on");
}

function getComponentDisplayName(type) {
  return type.name || "Anonymous";
}

function getDerivedComponentKey(type, parentName, jsxKey) {
  return `${getComponentDisplayName(type)}:${parentName}:${jsxKey ?? "undefined"}`;
}

function getElementEvents(dom) {
  if (!dom.__events) {
    dom.__events = {};
  }
  return dom.__events;
}

function invokeMountHooks(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const onMount = node.__onMount;
  if (typeof onMount === "function" && node.__onMountCalled !== true) {
    node.__onMountCalled = true;
    onMount.call(node, node);
  }

  for (const child of node.childNodes) {
    invokeMountHooks(child);
  }
}

function createDelegatedEvent(event, currentTarget) {
  return new Proxy(event, {
    get(target, prop) {
      if (prop === "currentTarget") return currentTarget;
      if (prop === "nativeEvent") return event;
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function removeDelegatedListeners(container, mount) {
  for (const [eventName, listener] of mount.delegatedListeners.entries()) {
    container.removeEventListener(eventName, listener);
  }
  mount.delegatedListeners.clear();
}

function cleanupMount(container) {
  const mount = mountPoints.get(container);
  if (!mount) {
    return;
  }

  removeDelegatedListeners(container, mount);
  mount.rootVNode = null;
  mount.renderedVNode = null;

  mountPoints.delete(container);

  const mountId = containerToId.get(container);
  if (mountId) {
    mountIdToContainer.delete(mountId);
  }

  if (currentMountContainer === container) {
    currentMountContainer = null;
  }
}

function ensureDelegatedListener(container, eventName) {
  const mount = getMountState(container);
  if (mount.delegatedListeners.has(eventName)) {
    return;
  }

  const delegatedListener = (event) => {
    let node = event.target;

    while (node && node !== container) {
      const handlers = node.__events;
      const handler = handlers?.[eventName];

      if (typeof handler === "function") {
        try {
          const delegatedEvent = createDelegatedEvent(event, node);
          handler.call(node, delegatedEvent);
        } catch (e) {
          console.error("Handler threw:", e);
        }
        if (event.cancelBubble) break;
      }

      node = node.parentNode;
    }
  };

  container.addEventListener(eventName, delegatedListener);
  mount.delegatedListeners.set(eventName, delegatedListener);
}

function setProp(dom, key, value, container) {
  if (key === "children" || key === "key") {
    return;
  }

  // need to be before next if
  if (key === "onMount") {
    dom.__onMount = typeof value === "function" ? value : undefined;
    return;
  }

  if (isEventProp(key)) {
    const eventName = key.slice(2).toLowerCase();
    const events = getElementEvents(dom);

    if (typeof value === "function") {
      events[eventName] = value;
      if (container) {
        ensureDelegatedListener(container, eventName);
      }
    } else {
      delete events[eventName];
    }

    return;
  }

  if (key === "className") {
    if (value === null || value === undefined || value === false) {
      dom.removeAttribute("class");
      return;
    }
    dom.setAttribute("class", value);
    return;
  }

  if (value === null || value === undefined || value === false) {
    dom.removeAttribute(key);
    return;
  }

  if (key === "value" || key === "htmlFor") {
    // special case
    dom[key] = value;

    // special handling for select
    setTimeout(() => {
      dom[key] = value;
    }, 0);
    return;
  }

  if (key === "style") {
    for (const sk in value) {
      dom.style[sk] = value[sk];
    }
    return;
  }

  if (key === "ref") {
    value?.(dom);
    return;
  }

  dom.setAttribute(key, value);
}

function updateProps(dom, oldProps = {}, newProps = {}, container) {
  for (const [key, oldValue] of Object.entries(oldProps)) {
    if (key === "children" || key === "key") {
      continue;
    }

    if (!(key in newProps)) {
      setProp(dom, key, undefined, container);
    }
  }

  for (const [key, newValue] of Object.entries(newProps)) {
    if (key === "children" || key === "key") {
      continue;
    }

    const oldValue = oldProps[key];
    if (oldValue !== newValue) {
      setProp(dom, key, newValue, container);
    }
  }
}

export function createDom(vnode, container) {
  if (vnode.type === TEXT_ELEMENT) {
    return document.createTextNode(vnode.props.nodeValue);
  }

  if (typeof vnode.type === "function") {
    return createDom(vnode.type(vnode.props || {}), container);
  }

  const dom = vnode?.type
    ? document.createElement(vnode.type)
    : document.createDocumentFragment();
  const props = vnode.props || {};

  for (const [key, value] of Object.entries(props)) {
    setProp(dom, key, value, container);
  }

  for (const child of props.children || []) {
    dom.appendChild(createDom(child, container));
  }

  return dom;
}

function resolveVNode(
  vnode,
  parentComponentName = "undefined",
  mountId = "undefined",
) {
  if (!vnode) {
    return null;
  }

  if (typeof vnode.type === "function") {
    const componentKey = getDerivedComponentKey(
      vnode.type,
      parentComponentName,
      vnode.props?.key,
    );

    // console.log(`Rendering component: ${componentKey}`);
    setCurrComp(`${mountId}|${componentKey}`);

    const nextProps = {
      ...(vnode.props || {}),
      _key: componentKey,
    };

    const nextVNode = {
      ...vnode,
      props: nextProps,
    };

    return resolveVNode(
      nextVNode.type(nextVNode.props),
      getComponentDisplayName(vnode.type),
      mountId,
    );
  }

  const props = vnode.props || {};
  const children = (props.children || [])
    .map((child) => resolveVNode(child, parentComponentName, mountId))
    .filter(Boolean);

  return {
    ...vnode,
    props: {
      ...props,
      children,
    },
  };
}

function patch(parent, dom, oldVNode, newVNode, container) {
  if (!oldVNode && newVNode) {
    const newDom = createDom(newVNode, container);
    parent.appendChild(newDom);
    invokeMountHooks(newDom);
    return newDom;
  }

  if (oldVNode && !newVNode) {
    parent.removeChild(dom);
    return null;
  }

  if (oldVNode.type !== newVNode.type) {
    const newDom = createDom(newVNode, container);
    parent.replaceChild(newDom, dom);
    return newDom;
  }

  if (newVNode.type === TEXT_ELEMENT) {
    if (oldVNode.props.nodeValue !== newVNode.props.nodeValue) {
      dom.nodeValue = newVNode.props.nodeValue;
    }
    return dom;
  }

  updateProps(dom, oldVNode.props || {}, newVNode.props || {}, container);

  const oldChildren = oldVNode.props?.children || [];
  const newChildren = newVNode.props?.children || [];
  const childDoms = Array.from(dom.childNodes);
  const maxChildren = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxChildren; i += 1) {
    patch(dom, childDoms[i], oldChildren[i], newChildren[i], container);
  }

  return dom;
}

function rerender() {
  if (!currentMountContainer) {
    return;
  }

  const mount = getMountState(currentMountContainer);
  if (!mount.rootVNode) {
    return;
  }

  const mountId = getMountId(currentMountContainer);
  const nextVNode = resolveVNode(mount.rootVNode, "undefined", mountId);
  const currentDom = currentMountContainer.firstChild;

  patch(
    currentMountContainer,
    currentDom,
    mount.renderedVNode,
    nextVNode,
    currentMountContainer,
  );
  mount.renderedVNode = nextVNode;
}

export function render(vnode, container) {
  if (vnode === null || vnode === undefined) {
    unmount(container);
    return;
  }

  const mount = getMountState(container);
  mount.rootVNode = vnode;

  setCurrentMount(container);
  rerender();
}

export function unmount(container) {
  if (!container) {
    return;
  }

  cleanupMount(container);
  container.replaceChildren();
}

export function rerenderMount(container) {
  setCurrentMount(container);
  rerender();
}

function rerenderAllMounts() {
  const previousMount = currentMountContainer;
  const containers = Array.from(mountPoints.keys());

  for (const container of containers) {
    if (!container.isConnected) {
      cleanupMount(container);
      continue;
    }
    setCurrentMount(container);
    rerender();
    console.log(`Rerendered mount: ${getMountId(container)}`);
  }
  setCurrentMount(previousMount);
}

function rerenderUpdatedMounts() {
  if (updateComps.size === 0) {
    return false;
  }

  const previousMount = currentMountContainer;
  const touchedMountIds = new Set();

  for (const compKey of updateComps) {
    const mountId = String(compKey).split("|")[0];
    if (mountId) {
      touchedMountIds.add(mountId);
    }
  }

  updateComps.clear();

  if (touchedMountIds.size === 0) {
    setCurrentMount(previousMount);
    return false;
  }

  for (const mountId of touchedMountIds) {
    const container = mountIdToContainer.get(mountId);
    if (!container || !mountPoints.has(container)) {
      continue;
    }

    if (!container.isConnected) {
      cleanupMount(container);
      continue;
    }

    setCurrentMount(container);
    rerender();
    console.log(`Rerendered updated mount: ${mountId}`);
  }

  setCurrentMount(previousMount);
  return true;
}

// All change related code

export function applyPropsPatches(patches) {
  const containers = Array.from(mountPoints.keys());

  for (let container in containers) {
    while (patches.length) {
      const patch = patches.shift();

      // updateProps(patch.$target, );
      updateProps(patch.$target, {}, patch.newProps, container);

      patch.$target = null;
      patch.newProps = null;
      patch.oldProps = null;
      // patch = null;
    }
  }
  patches.length = 0;
}

export function applyPatches(patches) {
  const disposalPromises = [];

  while (patches.length) {
    const patch = patches.shift();

    switch (patch.op) {
      case "APPENDDF":
        patch.p.appendChild(patch.c);
        break;
      case "APPEND":
        if (Array.isArray(patch.c)) {
          const l = patch.c.length;
          for (let i = 0; i < l; ++i) {
            patch.p.appendChild(createDom(patch.c[i]));
          }
        }

        patch.p.appendChild(createDom(patch.c));
        break;

      case "REMOVE":
        patch.p.removeChild(patch.c);
        // disposalPromises.push(disposeNodes(patch.c));
        break;

      case "REMOVEALL":
        // const childrenToDispose = Array.from(patch.p.childNodes);
        // disposalPromises.push(
        //   Promise.all(childrenToDispose.map((c) => disposeNodes(c))),
        // );

        if (patch.p.replaceChildren) {
          patch.p.replaceChildren();
        } else {
          while (patch.p.firstChild) {
            patch.p.removeChild(patch.p.firstChild);
          }
        }
        break;

      case "REPLACE":
        patch.p.replaceChild(createDom(patch.c[0]), patch.c[1]);
        // disposalPromises.push(disposeNodes(patch.c[1]));
        break;

      case "REPLACEALL":
        const l = patch.c.length;
        const newArr = [];
        for (let i = 0; i < l; ++i) {
          newArr.push(createDom(patch.c[i]));
        }
        patch.p.replaceChildren(...newArr);
        newArr.length = 0;
        // disposalPromises.push(disposeNodes(patch.c[1]));
        break;

      case "CONTENT":
        patch.p.textContent = patch.c;
        break;
    }

    patch.p = patch.c = null;
  }

  patches.length = 0;

  // Cleanup all references after all disposals complete
  // if (disposalPromises.length > 0) {
  //   Promise.all(disposalPromises)
  //     .catch((err) => log("Error during node disposal:", err))
  //     .finally(() => {
  //       disposalPromises.length = 0;
  //     });
  // }
}
