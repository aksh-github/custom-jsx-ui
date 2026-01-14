/** @jsx h */
import { h } from "./vdom-lib";

const CASE_TYPE = 0x2e3;
const DEFAULT_TYPE = 0x2e4;

/**
 * * Switch Component - Renders only the first matching child *
 * * @example * <Switch value={count}>
 * * <Case when={0} component={Home} />
 * * <Case when={1} render={() => <About />} />
 * * <Case when={2}><Counter /></Case>
 * * <Default component={NotFound} />
 * * </Switch> */
function Switch({ value }, children) {
  if (!Array.isArray(children)) {
    children = [children];
  }
  // Find the first matching Case or Default
  for (let child of children) {
    if (!child) continue;
    const componentName = child?.value?.$t;
    // Check if it's a Case component with matching value
    if (componentName === CASE_TYPE && child.props?.when === value) {
      return renderCaseContent(child);
    }
    // // Check if it's a Default component
    if (componentName === DEFAULT_TYPE) {
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

function Case(props, children) {
  return { $t: CASE_TYPE, children };
}

function Default(props, children) {
  return { $t: DEFAULT_TYPE, children };
}

// Attach sub-components to Switch
Switch.Case = Case;
Switch.Default = Default;

// Still export individually for backwards compatibility
export { Switch, Case, Default };
