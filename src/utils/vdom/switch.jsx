// import { h } from "@vdom-lib";

/**
 * * Switch Component - Renders only the first matching child *
 * * @example * <Switch value={count}>
 * * <Case when={0} component={Home} />
 * * <Case when={1} render={() => <About />} />
 * * <Case when={2}><Counter /></Case>
 * * <Default component={NotFound} />
 * * </Switch> */
export function Switch({ value }, children) {
  if (!Array.isArray(children)) {
    children = [children];
  }
  // Find the first matching Case or Default
  for (let child of children) {
    if (!child) continue;
    const componentName = child.$c;
    // Check if it's a Case component with matching value
    if (componentName === "Case" && child.props?.when === value) {
      return renderCaseContent(child);
    }
    // // Check if it's a Default component
    if (componentName === "Default") {
      return renderCaseContent(child);
    }
  }
  return null;
}

/**
 * Helper function to render Case/Default content
 */
function renderCaseContent(child) {
  const props = child.props || {};

  // Priority 1: component prop
  if (props.component) {
    const Component = props.component;
    return <Component {...props.componentProps} />;
  }

  // Priority 2: render function prop
  if (typeof props.render === "function") {
    return props.render(props.renderProps || {});
  }

  // Priority 3: children JSX
  return child.value?.children?.[0] || null;
}

/**
 * Case Component - Represents a single case in a Switch
 *
 * @param {Object} props
 * @param {*} props.when - Value to match against Switch value
 * @param {Function} [props.component] - Component to render
 * @param {Function} [props.render] - Render function
 * @param {Object} [props.componentProps] - Props to pass to component
 * @param {Object} [props.renderProps] - Props to pass to render function
 */
export function Case(props, children) {
  return { children };
}

/**
 * Default Component - Fallback case in a Switch
 *
 * @param {Object} props
 * @param {Function} [props.component] - Component to render
 * @param {Function} [props.render] - Render function
 * @param {Object} [props.componentProps] - Props to pass to component
 * @param {Object} [props.renderProps] - Props to pass to render function
 */
export function Default(props, children) {
  return { children };
}
