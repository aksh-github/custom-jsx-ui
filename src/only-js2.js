function h(type, props, ...children) {
  // Mark fragment nodes with a special prop
  const isFragment =
    type === "" || type === Symbol.for("vdom.fragment") || type === "fragment";
  return {
    type,
    props: { ...(props || {}), ...(isFragment ? { __isFragment: true } : {}) },
    __isFragment: isFragment,
    children: children.flat().map((child) => child),
  };
}

function createElement(vnode) {
  // Support function components
  if (typeof vnode === "function") {
    return createElement(vnode());
  }
  // Support function as type (function component)
  if (vnode && typeof vnode.type === "function") {
    return createElement(
      vnode.type({ ...(vnode.props || {}), children: vnode.children })
    );
  }
  // Support fragments: type === React.Fragment or type === undefined or type === null or type === ""
  if (
    vnode &&
    (vnode.type === "" ||
      vnode.type === Symbol.for("vdom.fragment") ||
      vnode.type === "fragment")
  ) {
    const frag = document.createDocumentFragment();
    (vnode.children || []).forEach((child) => {
      frag.appendChild(createElement(child));
    });
    return frag;
  }
  if (vnode === null || vnode === undefined || typeof vnode === "boolean") {
    return document.createTextNode("");
  }
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(vnode);
  }

  if (typeof vnode.type !== "string") {
    throw new Error("Invalid node type: " + vnode.type);
  }

  const el = document.createElement(vnode.type);
  // Set props/attributes
  for (const [key, value] of Object.entries(vnode.props || {})) {
    if (key === "className") {
      el.className = value;
    } else {
      el.setAttribute(key, value);
    }
  }

  // Append children
  (vnode.children || []).forEach((child) => {
    el.appendChild(createElement(child));
  });
  return el;
}

function Food({ name, price }) {
  return h(
    "div",
    { className: "food-item" },
    h("h2", null, name),
    h("p", null, `Price: $${price}`)
  );
}

// Example usage:
const vdom = h(
  "div",
  { id: "main" },

  h("h1", { className: "title" }, "Hello World"),
  h("p", { className: "description" }, "This is a description."),
  h("span", null, "this is virtual World"),
  h(Food, { name: "Pizza", price: 9.99 })
);

console.log(vdom);

// Example usage:
document.body.appendChild(createElement(vdom));

const fragVdom = h(
  "", // or use "fragment"
  null,
  h("span", null, "A"),
  h("h2", null, "B"),
  h("div", null, 0),
  h("span", null, undefined),
  h("span", null, null),
  h("span", null, true),
  h("span", null, false)
  // h("span", null, { a: 10 })
);

console.log(fragVdom);
document.body.appendChild(createElement(fragVdom));
