function h(type, props, ...children) {
  // Mark fragment nodes with a special prop

  return {
    type,
    props: { ...(props || {}) },

    children: children.flat().map((child) => child),
  };
}

// create a function that uses linked list from jsx

function jsxToLinkedList(vnode) {
  // Helper to create a linked list node with firstChild and next
  function createNode(value) {
    return { value, firstChild: null, next: null };
  }

  // Recursively convert vnode tree to linked list with firstChild/next
  function traverse(node) {
    if (node == null) return null;

    // If node is an array, flatten and link each child via next
    if (Array.isArray(node)) {
      let head = null,
        current = null;
      for (const child of node) {
        const childNode = traverse(child);
        if (childNode) {
          if (!head) {
            head = childNode;
            current = head;
          } else {
            current.next = childNode;
            current = current.next;
          }
          // Move to the end of the current child's chain
          while (current && current.next) current = current.next;
        }
      }
      return head;
    }

    // If node is a primitive, wrap in a linked list node
    if (
      typeof node === "string" ||
      typeof node === "number" ||
      typeof node === "boolean" ||
      node === undefined ||
      node === null
    ) {
      return createNode(node);
    }

    // If node is a vnode object
    const linkedNode = createNode({
      type: node.type,
      props: node.props,
    });

    // children will be a linked list via firstChild/next
    if (node.children && node.children.length > 0) {
      linkedNode.firstChild = traverse(node.children);
    }

    return linkedNode;
  }

  return traverse(vnode);
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

console.log(vdom, jsxToLinkedList(vdom));

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
