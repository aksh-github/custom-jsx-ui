function escapeHtml(unsafe) {
  // Early return for null/undefined
  if (unsafe == null) return "";

  // Convert to string (handles numbers, booleans, etc.)
  const str = String(unsafe);

  // Fast path: if no special chars, return as-is
  if (!/[&<>"']/.test(str)) return str;

  // Use a single replace with lookup map for better performance
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

function serializeStyle(styleObj) {
  if (typeof styleObj !== "object" || styleObj === null) {
    return escapeHtml(String(styleObj));
  }

  return Object.entries(styleObj)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(
        /[A-Z]/g,
        (match) => `-${match.toLowerCase()}`,
      );
      return `${cssKey}:${value}`;
    })
    .join(";");
}

const DANGEROUS_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
]);

export function renderToString(jsx) {
  // console.log("renderToString called with:", jsx);

  if (typeof jsx === "string" || typeof jsx === "number") {
    return escapeHtml(jsx) + "<!--|-->";
  } else if (jsx == null || typeof jsx === "boolean") {
    return null + "<!--|-->";
  } else if (Array.isArray(jsx)) {
    return jsx.map((child) => renderToString(child)).join("");
  } else if (typeof jsx === "object") {
    if (typeof jsx.type === "string") {
      if (jsx.type === "df") {
        return renderToString(jsx.children);
      }

      // FIX: Block dangerous tags during SSR but continue rendering
      let html = "";
      let avoidChildren = false;
      if (DANGEROUS_TAGS.has(jsx.type)) {
        // console.warn(`⚠️ Blocked dangerous <${jsx.type}> tag during SSR`);
        // return `<!-- Blocked: ${jsx.type} -->` + renderToString(jsx.children);
        avoidChildren = true;
      }

      if (jsx.type === "br" || jsx.type === "hr") {
        return (html += `<${jsx.type} />`);
      }

      html = "<" + jsx.type;
      for (const propName in jsx.props) {
        if (
          jsx.props.hasOwnProperty(propName)

          // && propName !== "ref" &&
          // propName !== "key" &&
          // propName !== "fragChildLen" &&
          // propName !== "ignoreNode"
        ) {
          const propValue = jsx.props[propName];

          if (propName === "onSubmit") {
            html += ` onSubmit=""`;
          }

          if (
            propValue == null ||
            propValue === false ||
            /^on[A-Z]/.test(propName)
          ) {
            continue;
          }

          if (propName === "className") {
            html += ` class="${escapeHtml(propValue)}"`;
          } else if (propName === "style") {
            html += ` style="${serializeStyle(propValue)}"`;
          } else if (propValue === true) {
            html += ` ${propName}`;
          } else if (propName === "ignoreNode") {
            html += ` ignorenode="true"`;
            avoidChildren = true;
          } else if (typeof propValue !== "function") {
            if (
              propName === "href" &&
              String(propValue).startsWith("javascript:")
            ) {
              console.warn(`⚠️ Blocked dangerous attribute: ${propName}`);
              continue;
            }
            html += ` ${propName}="${escapeHtml(propValue)}"`;
          }
        }
      }
      html += ">";
      if (!avoidChildren) {
        html += renderToString(jsx.children);
        avoidChildren = false;
      }
      html += "</" + jsx.type + ">";
      return html;
    } else if (typeof jsx.type === "function") {
      const Component = jsx.type;
      const props = jsx.props;
      const children = jsx.children;
      const returnedJsx = Component(props, children);
      return renderToString(returnedJsx);
    } else {
      // something like {'$c': 'Switch', value: 'this is 10 (some str)', props: { value: 10 }, '$p': 'SomeParent', type: undefined}

      // is it required in below if? && typeof jsx.value !== "undefined"
      if (jsx?.$c) {
        return escapeHtml(jsx.value) + "<!--|-->";
      } else {
        console.log("Inner else Unknown jsx type:", jsx);
        throw new Error("Not implemented.");
      }
    }
  } else {
    console.log("Outer else Unknown jsx type:", jsx);
    throw new Error("Not implemented.");
  }
}
