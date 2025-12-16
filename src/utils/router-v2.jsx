import { h, createContext, createState, createEffect } from "@vdom-lib";

// import { domv2, onMount, onCleanup } from "./dom/lib.v2";

// console.log(
//   "check: https://github.com/nanojsx/nano/blob/master/src/components/router.ts"
// );
// console.log(
//   "check: https://codesandbox.io/s/build-own-react-router-v4-mpslz , https://www.youtube.com/watch?v=1knvu0a3k0w"
// );

const historyPush = (path, state) => {
  window.history.pushState(state, null, path);
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

const historyReplace = (path) => {
  window.history.replaceState(state, null, path);
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

const matchPath = (pathname, options) => {
  const { exact = false, path } = options;

  if (!path) {
    return {
      pathname: pathname,
      isExact: true,
    };
  }

  const match = new RegExp(`^${path}`).exec(pathname);

  if (!match) return null;

  const _pathname = match[0];
  const isExact = pathname === _pathname;

  if (exact && !isExact) return null;

  return {
    pathname,
    isExact,
  };
};

export function LinkV2(props, children) {
  // console.log(props, children);
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
  console.log(window.location.pathname, navigationEvent);

  if (routerContext.get()?.pathname !== window.location.pathname) {
    // setCurrPath(window.location.pathname);
    const { pathname } = window.location;
    console.log({
      ...matchPath(pathname, {}),
      search: window.location.search,
      hash: window.location.hash,
      state: window.history.state,
    });
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
        ...matchPath(routerContext.get()?.pathname, {}),
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
});

export const routeInstance = Router();
routeInstance.init();

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
    routeInstance.init(onRouteChange);
    return () => {
      routeInstance.cleanup();
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
  //     console.log(Comp);
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
      (routeObj["404"]?.render
        ? routeObj["404"].render(finalUrl)
        : routeObj["404"])
    );
  }
};

export const Switch = ({ condition }, children) => {
  if (!children) {
    return null;
  }

  const arrayOfChildren = Array.isArray(children) ? children : [children];
  const matchedCase = arrayOfChildren.find(
    (child) => child.props.when == condition
  );
  const defaultCases = arrayOfChildren.filter((child) => !child.props.when);

  if (defaultCases?.length > 1) {
    throw new Error("Only one <Switch.Default> is allowed");
  }

  const defaultCase = defaultCases[0];

  return matchedCase ? matchedCase.props.children : defaultCase?.props.children;
};

Switch.Case = ({ when }, children) => {
  return <df>{children}</df>;
};

Switch.Default = (props, children) => {
  return <df>{children}</df>;
};
