import { h as hProxy, diff, patch, create } from "virtual-dom";

function h(type, props, ...children) {
  return hProxy(type, props, [children]);
}

// 1: Create a function that declares what the DOM should look like
function render(count) {
  // return h(
  //   "div",
  //   {
  //     style: {
  //       textAlign: "center",
  //       lineHeight: 100 + "px",
  //       border: "1px solid red",
  //       width: 100 + "px",
  //       height: 100 + "px",
  //     },
  //     className: "divclass",
  //   },
  //   [String(count), h("input")]
  // );
  return (
    <div className="divclass">
      <input /> {count}
    </div>
  );
}

// 2: Initialise the document
var count = 0; // We need some app data. Here we just store a count.

var tree = render(count); // We need an initial tree
console.log(tree);
var rootNode = create(tree); // Create an initial root DOM node ...
document.querySelector("#root-vdom").appendChild(rootNode); // ... and it should be in the document

// 3: Wire up the update logic
const td = setInterval(function () {
  count++;

  if (count > 5) clearInterval(td);

  var newTree = render(count);
  var patches = diff(tree, newTree);
  console.log(patches);
  rootNode = patch(rootNode, patches);
  tree = newTree;
}, 2400);
