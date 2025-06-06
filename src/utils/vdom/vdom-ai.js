// Use WeakMap for event listeners (no DOM pollution)
const listenersMap = new WeakMap();

function addListener(el, event, handler) {
  el.addEventListener(event, handler);
  let map = listenersMap.get(el) || {};
  map[event] = handler;
  listenersMap.set(el, map);
}

function removeListeners(el) {
  const map = listenersMap.get(el);
  if (map) {
    for (const event in map) {
      el.removeEventListener(event, map[event]);
    }
    listenersMap.delete(el);
  }
}

const MyUILib = (() => {
  /**
   * Creates a real DOM node from a component or element description.
   * @param {string|Function} type - Tag name or component function.
   * @param {Object} props - Props/attributes.
   * @param {...any} children - Child elements or text.
   * @returns {HTMLElement|Text}
   */
  function createDomElement(type, props = {}, ...children) {
    // If type is a function, treat as a component
    if (typeof type === "function") {
      return type({ ...props, children });
    }
    // If type is a string, create an element
    const el = document.createElement(type);

    // Set attributes and event listeners
    for (const key in props) {
      if (key === "children") continue;
      if (key.startsWith("on") && typeof props[key] === "function") {
        const eventName = key.slice(2).toLowerCase();
        // Remove old listener if exists
        removeListeners(el);
        addListener(el, eventName, props[key]);
      } else if (key === "className") {
        el.setAttribute("class", props[key]);
      } else if (key === "style" && typeof props[key] === "object") {
        Object.assign(el.style, props[key]);
      } else if (props[key] === true) {
        el.setAttribute(key, "");
      } else if (props[key] === false) {
        el.removeAttribute(key);
      } else if (key === "ref" && typeof props[key] === "function") {
        // Handle ref callback
        props[key](el);
      } else {
        el.setAttribute(key, props[key]);
      }
    }
    // Append children
    children.flat().forEach((child) => {
      if (child == null) return;
      if (typeof child === "string" || typeof child === "number") {
        el.appendChild(document.createTextNode(child));
      } else if (
        child === null ||
        child === undefined ||
        child === true ||
        child === false
      ) {
      } else if (Array.isArray(child)) {
        child.forEach((c) =>
          el.appendChild(
            typeof c === "string" || typeof c === "number"
              ? document.createTextNode(c)
              : c
          )
        );
      } else {
        el?.appendChild(child);
      }
    });
    return el;
  }

  /**
   * Removes all event listeners from a DOM node and its children.
   * @param {HTMLElement} node
   */
  function removeAllEventListeners(node) {
    removeListeners(node);
    if (node && node.childNodes) {
      node.childNodes.forEach((child) => removeAllEventListeners(child));
    }
  }

  /**
   * Renders a component or element tree into a container.
   * @param {HTMLElement|Text} node - The root node to render.
   * @param {HTMLElement} container - The DOM container.
   */
  function render(node, container) {
    container.childNodes.forEach((child) => removeAllEventListeners(child));
    container.innerHTML = "";
    container.appendChild(node);
    return node;
  }

  function applyPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();

      switch (patch.op) {
        case "APPEND":
          patch.p.appendChild(patch.c);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "INSERT_BEFORE":
          patch.p.insertBefore(patch.c, patch.ref);
          patch.c = null;
          patch.p = null;
          patch.ref = null;
          patch.op = null;
          break;
        case "INSERT_AFTER":
          if (patch.ref && patch.ref.nextSibling) {
            patch.p.insertBefore(patch.c, patch.ref.nextSibling);
          } else {
            patch.p.appendChild(patch.c);
          }
          patch.c = null;
          patch.p = null;
          patch.ref = null;
          patch.op = null;
          break;
        case "REMOVE":
          removeAllEventListeners(patch.c);
          patch.p.removeChild(patch.c);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "REPLACE":
          removeAllEventListeners(patch.c[1]);
          patch.p.replaceChild(patch.c[0], patch.c[1]);
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
        case "CONTENT":
          patch.p.textContent = patch.c;
          patch.c = null;
          patch.p = null;
          patch.op = null;
          break;
      }
    }
  }

  function applyPropsPatches(patches) {
    while (patches.length) {
      const patch = patches.shift();
      updateProps(patch.$target, patch.newProps, patch.oldProps);
      patch.$target = null;
      patch.newProps = null;
      patch.oldProps = null;
    }
  }

  return {
    createDomElement,
    render,
    applyPatches,
    applyPropsPatches,
    removeAllEventListeners,
  };
})();

export default MyUILib;
export const { createDomElement, render, applyPatches, applyPropsPatches } =
  MyUILib;
