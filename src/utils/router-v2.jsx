/** @jsx h */
import { h, createContext, createState, createEffect } from "@vdom-lib";

const isServer = typeof window === "undefined";
const noop = () => {};

// const log = console.log;
const log = () => {};

// import { domv2, onMount, onCleanup } from "./dom/lib.v2";

// log(
//   "check: https://github.com/nanojsx/nano/blob/master/src/components/router.ts"
// );
// log(
//   "check: https://codesandbox.io/s/build-own-react-router-v4-mpslz , https://www.youtube.com/watch?v=1knvu0a3k0w"
// );

// SSR pathname - set from server
let ssrPathname = "/";
let ssrSearch = "";
let ssrHash = "";

// export const setSSRPathname = (pathname) => {
//   ssrPathname = ssrUrl = pathname;
// };

// Parse URL to extract pathname, search, hash
export const setSSRUrl = (url) => {
  try {
    // Handle full URL or path
    const urlObj = new URL(url, "http://localhost");
    ssrPathname = urlObj.pathname;
    ssrSearch = urlObj.search;
    ssrHash = urlObj.hash;
    routerContext.set({
      search: ssrSearch,
      hash: ssrHash,
      state: null,
      pathname: ssrPathname,
    });
  } catch (e) {
    // Fallback: simple parsing
    const hashIdx = url.indexOf("#");
    const searchIdx = url.indexOf("?");

    if (hashIdx > -1) {
      ssrHash = url.slice(hashIdx);
      url = url.slice(0, hashIdx);
    }

    if (searchIdx > -1) {
      ssrSearch = url.slice(searchIdx);
      ssrPathname = url.slice(0, searchIdx);
    } else {
      ssrPathname = url;
    }

    routerContext.set({
      search: ssrSearch,
      hash: ssrHash,
      state: null,
      pathname: ssrPathname,
    });
  }
};

const historyPush = isServer
  ? noop
  : (path, state) => {
      window.history.pushState(state, "", path);
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

const historyReplace = isServer
  ? noop
  : (path, state) => {
      window.history.replaceState(state, "", path);
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

  const handleClick = isServer
    ? noop
    : (e) => {
        e.preventDefault();
        const href = e.target.getAttribute("href");
        const pathname = window.location.pathname;
        if (href === pathname) return;
        replace ? historyReplace(to) : historyPush(to);
      };

  return (
    <a href={to} onClick={handleClick}>
      {children}
    </a>
  );
}

const navigate = isServer
  ? noop
  : (navigationEvent) => {
      if (routerContext.get()?.pathname !== window.location.pathname) {
        const { pathname } = window.location;

        routerContext.set({
          ...matchPath(pathname, {}),
          search: window.location.search,
          hash: window.location.hash,
          state: window.history.state,
        });
      }
    };

// const { get: currPath, set: setCurrPath } = routerContext;

// correct impl as of 11 Dec
function Router() {
  let onRouteChange;

  return {
    init: isServer
      ? noop
      : (cb) => {
          window.addEventListener("popstate", navigate);
          window.addEventListener("navigate", navigate);
          onRouteChange = cb || (() => {});
          onRouteChange({
            search: window.location.search,
            hash: window.location.hash,
            state: window.history.state,
            ...matchPath(
              routerContext.get()?.pathname || window.location.pathname,
              {},
            ),
          });
        },
    cleanup: isServer
      ? noop
      : () => {
          window.removeEventListener("popstate", navigate);
          window.removeEventListener("navigate", navigate);
        },
    navigator: {
      go: historyPush,
      replace: historyReplace,
    },
  };
}

// SSR-safe context initialization
const initialRouterState = isServer
  ? {
      search: ssrSearch,
      hash: ssrHash,
      state: null,
      pathname: ssrPathname,
      params: {},
    }
  : {
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state,
      pathname: window.location.pathname,
      params: {},
    };

export const routerContext = createContext(initialRouterState);

export const routerInstance = Router();

if (!isServer) routerInstance.init();

export const RouterAdv = ({ routeObj }) => {
  // const [curPath, setCurPath] = createState({
  //   pathname: isServer
  //     ? ssrPathname
  //     : routerContext.get()?.pathname || window.location.pathname,
  // });

  const onRouteChange = (routeConfig) => {
    // setCurPath(routerContext.get());
    // routerContext.set(routeConfig);
  };

  createEffect(() => {
    routerInstance.init(onRouteChange);
    return () => {
      routerInstance.cleanup();
    };
  }, []);

  const finalUrl = isServer ? ssrPathname : routerContext.get()?.pathname;

  // console.log(finalUrl);

  // Iterate through routes to find first match (supports dynamic paths)
  const routeKeys = Object.keys(routeObj);
  for (let i = 0; i < routeKeys.length; i++) {
    const path = routeKeys[i];
    const match = matchPath(finalUrl, {
      path,
      exact: routeKeys[i].includes("*") ? false : true,
    });

    if (match) {
      const Comp = routeObj[path];
      if (Comp && typeof Comp === "function") {
        return <Comp />;
      } else {
        return Comp?.render?.() || Comp;
      }
    }
  }

  // Fallback to 404
  return null;
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
  const finalUrl = isServer
    ? ssrPathname
    : routerContext.get()?.pathname || window.location.pathname;

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
  const finalUrl = isServer
    ? ssrPathname
    : routerContext.get()?.pathname || window.location.pathname;

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
