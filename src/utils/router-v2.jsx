/** @jsx h */
import { h, createContext, createState, createEffect } from "@vdom-lib";

// const log = console.log;
const log = () => {};

// import { domv2, onMount, onCleanup } from "./dom/lib.v2";

// log(
//   "check: https://github.com/nanojsx/nano/blob/master/src/components/router.ts"
// );
// log(
//   "check: https://codesandbox.io/s/build-own-react-router-v4-mpslz , https://www.youtube.com/watch?v=1knvu0a3k0w"
// );

const historyPush = (path, state) => {
  window.history.pushState(state, "", path);
  //   instances.forEach((instance) => instance.forceUpdate());
  window.dispatchEvent(new PopStateEvent("navigate"));
  // window.dispatchEvent(new Event("pushstate"));
  if (routerContext.get()?.pathname !== window.location.pathname) {
    routerContext.set({
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state,
      pathname: window.location.pathname,
    });
  }
};

const historyReplace = (path, state) => {
  window.history.replaceState(state, "", path);
  //   instances.forEach((instance) => instance.forceUpdate());
  window.dispatchEvent(new PopStateEvent("navigate"));
  if (routerContext.get()?.pathname !== window.location.pathname) {
    routerContext.set({
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state,
      pathname: window.location.pathname,
    });
  }
};

/**
 * Converts path pattern to regex and extracts parameter names
 * @param {string} path - Path pattern like "/users/:id" or "/posts/:postId/comments/:commentId"
 * @returns {Object} - { regex, paramNames }
 */
const pathToRegex = (path) => {
  const paramNames = [];

  // Escape special regex characters except : and *
  let regexPath = path
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    // Replace :param with capturing group
    .replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^\\/]+)"; // Match anything except /
    })
    // Replace * with wildcard
    .replace(/\*/g, "(.*)");

  return {
    regex: new RegExp(`^${regexPath}$`),
    paramNames,
  };
};

/**
 * Matches a pathname against a route pattern and extracts parameters
 * @param {string} pathname - Current URL pathname
 * @param {Object} options - { exact, path }
 * @returns {Object|null} - Match object with pathname, params, isExact or null
 */
const matchPath = (pathname, options) => {
  const { exact = false, path } = options;

  if (!path) {
    return {
      pathname: pathname,
      params: {},
      isExact: true,
    };
  }

  // Check if path has dynamic segments
  const hasDynamicSegments = path.includes(":") || path.includes("*");

  if (!hasDynamicSegments) {
    // Simple exact match for static paths
    const isExact = pathname === path;
    const match = exact ? isExact : pathname.startsWith(path);

    if (!match) return null;

    return {
      pathname,
      params: {},
      isExact,
    };
  }

  // Dynamic path matching
  const { regex, paramNames } = pathToRegex(path);
  const match = regex.exec(pathname);

  if (!match) return null;

  const _pathname = match[0];
  const isExact = pathname === _pathname;

  if (exact && !isExact) return null;

  // Extract parameters from matches
  const params = {};
  paramNames.forEach((paramName, index) => {
    params[paramName] = match[index + 1];
  });

  return {
    pathname,
    params,
    isExact,
    path,
  };
};

export function LinkV2(props, children) {
  // log(props, children);
  const { to, replace } = props;

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        const href = e.target.getAttribute("href");
        const pathname = window.location.pathname;
        if (href === pathname) return;
        replace ? historyReplace(to) : historyPush(to);
        // setCurentPath(to);
        // routerContext.set({ pathname: to, ...routerContext.get() });
      }}
    >
      {children}
    </a>
  );
}

const navigate = (navigationEvent) => {
  // log(window.location.pathname, navigationEvent);

  if (routerContext.get()?.pathname !== window.location.pathname) {
    // setCurrPath(window.location.pathname);
    const { pathname } = window.location;
    // log({
    //   ...matchPath(pathname, {}),
    //   search: window.location.search,
    //   hash: window.location.hash,
    //   state: window.history.state,
    // });
    routerContext.set({
      ...matchPath(pathname, {}),
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state,
    });
    // onRouteChange({
    //   ...matchPath(pathname, {}),
    //   search: window.location.search,
    //   hash: window.location.hash,
    //   state: window.history.state,
    // });
  }
};

// const { get: currPath, set: setCurrPath } = routerContext;

// correct impl as of 11 Dec
function Router() {
  let onRouteChange;

  return {
    init: (cb) => {
      window.addEventListener("popstate", navigate);
      // window.addEventListener("pushstate", navigate);
      window.addEventListener("navigate", navigate);
      onRouteChange = cb || (() => {});
      onRouteChange({
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state,
        // ...matchPath(routerContext.get()?.pathname, {}),
        ...matchPath(
          routerContext.get()?.pathname || window.location.pathname,
          {}
        ),
      });
    },
    cleanup: () => {
      window.removeEventListener("popstate", navigate);
      // window.removeEventListener("pushstate", navigate);
      window.removeEventListener("navigate", navigate);
    },
    navigator: {
      go: historyPush,
      replace: historyReplace,
    },
  };
}

export const routerContext = createContext({
  search: window.location.search,
  hash: window.location.hash,
  state: window.history.state,
  pathname: window.location.pathname,
  params: {},
});

export const routerInstance = Router();
routerInstance.init();

export const RouterAdv = ({ routeObj }) => {
  const [curPath, setCurPath] = createState({
    pathname: window.location.pathname,
  });

  const onRouteChange = (routeConfig) => {
    // setCurPath(newPath);
    setCurPath(routerContext.get());
    routerContext.set(routeConfig);
  };

  createEffect(() => {
    routerInstance.init(onRouteChange);
    return () => {
      routerInstance.cleanup();
    };
  }, []);

  // const routeKeys = Object.keys(routeObj);

  // for (let i = 0; i < routeKeys.length; i++) {
  //   const path = routeKeys[i];
  //   const match = matchPath(curPath?.pathname, {
  //     path,
  //     exact: true,
  //   });
  //   if (match) {
  //     const Comp = routeObj[path];
  //     log(Comp);
  //     if (Comp && typeof Comp === "function") {
  //       return <Comp match={match} />;
  //     } else {
  //       return Comp;
  //     }
  //   }
  // }
  const finalUrl = routerContext.get()?.pathname || curPath?.pathname;
  const Comp = routeObj[`${finalUrl}`];
  if (Comp && typeof Comp === "function") {
    return <Comp />;
  } else {
    return (
      Comp?.render?.() ||
      (routeObj["404"]?.render ? routeObj["404"].render() : routeObj["404"])
    );
  }
};

/**
 * RouterSwitch component - renders only the first matching route
 * Prevents multiple routes from rendering simultaneously
 *
 * Usage:
 * <RouterSwitch>
 * <Route path="/users/:id" component={UserProfile} />
 * <Route path="/users" component={UserList} />
 * <Route path="/docs/*" component={Docs} />
 * <Route path="*" component={NotFound} />
 * </RouterSwitch>
 */
export function RouterSwitch(props, children) {
  const finalUrl = routerContext.get()?.pathname || window.location.pathname;

  // Ensure children is an array
  const childArray = Array.isArray(children) ? children : [children];

  // Find first matching route
  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];

    // Skip non-Route children
    if (!child || !child.props) return null;

    const { path, exact = true } = child.props;

    // Match wildcard or specific path
    const match = path
      ? matchPath(finalUrl, { path, exact })
      : { pathname: finalUrl, params: {}, isExact: true }; // path="*" or no path

    if (match) {
      log("RouterSwitch matched:", path, match);

      // log(props, child, children);
      return child;
      // const {
      //   component: Component,
      //   render,
      //   children: routeChildren,
      // } = child.props;
      // // Priority: children > component > render
      // if (routeChildren) {
      //   return typeof routeChildren === "function"
      //     ? routeChildren()
      //     : routeChildren;
      // }
      // if (Component) {
      //   return <Component match={match} params={match.params} />;
      // }
      // if (render) {
      //   return render();
      // }
      // return null;
    }
  }

  // No match found
  return null;
}

/**
 * Route component - wraps a component with path matching
 * Used inside RouterSwitch to declaratively define routes
 */
function Route({ path, exact = true, component: Component, render }, children) {
  const finalUrl = routerContext.get()?.pathname || window.location.pathname;

  const match = matchPath(finalUrl, { path, exact });

  if (!match) return null;

  // Priority: component > render

  if (Component) {
    return <Component />;
  }

  if (render) {
    return render();
  }

  return null;
}

RouterSwitch.Route = Route;
export { Route };
