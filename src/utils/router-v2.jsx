import { h, createContext, createState } from "@vdom-lib";
import { createEffect } from "./simple-state";
// import { domv2, onMount, onCleanup } from "./dom/lib.v2";

// console.log(
//   "check: https://github.com/nanojsx/nano/blob/master/src/components/router.ts"
// );
// console.log(
//   "check: https://codesandbox.io/s/build-own-react-router-v4-mpslz , https://www.youtube.com/watch?v=1knvu0a3k0w"
// );

const historyPush = (path) => {
  window.history.pushState({}, null, path);
  //   instances.forEach((instance) => instance.forceUpdate());
  window.dispatchEvent(new PopStateEvent("navigate"));
  // window.dispatchEvent(new Event("pushstate"));
};

const historyReplace = (path) => {
  window.history.replaceState({}, null, path);
  //   instances.forEach((instance) => instance.forceUpdate());
  window.dispatchEvent(new PopStateEvent("navigate"));
};

const matchPath = (pathname, options) => {
  const { exact = false, path } = options;

  if (!path) {
    return {
      path: null,
      url: pathname,
      isExact: true,
    };
  }

  const match = new RegExp(`^${path}`).exec(pathname);

  if (!match) return null;

  const url = match[0];
  const isExact = pathname === url;

  if (exact && !isExact) return null;

  return {
    path,
    url,
    isExact,
  };
};

const [currentPath, setCurentPath] = createState(window.location.pathname);

// export function Route() {
//   //   const currentPath = createState(window.location.pathname);

//   const navigate = (abcd) => {
//     console.log(window.location.pathname, abcd);
//     if (currentPath() !== window.location.pathname)
//       setCurentPath(window.location.pathname);
//   };

//   onMount(() => {
//     window.addEventListener("popstate", navigate);
//     window.addEventListener("navigate", navigate);
//   });

//   onCleanup(() => {
//     window.removeEventListener("popstate", navigate);
//     window.removeEventListener("navigate", navigate);
//   });

//   return (props) => {
//     const { path, exact, component, render } = props;

//     const match = matchPath(window.location.pathname, { path, exact });

//     if (!match) return null;

//     if (component) return h(component, { match });

//     console.log(props);

//     if (render) return render({ match });

//     return null;
//   };
// }

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
        setCurentPath(to);
      }}
    >
      {children}
    </a>
  );
}

export const routerContext = createContext(window.location.pathname);

const { get: currPath, set: setCurrPath } = routerContext;

// correct impl as of 11 Dec
export function Router() {
  // const [currPath, setCurrPath] = atom(window.location.pathname);
  let onRouteChange;
  const navigate = (abcd) => {
    console.log(window.location.pathname, abcd);
    if (currPath() !== window.location.pathname) {
      setCurrPath(window.location.pathname);
      onRouteChange(matchPath(currPath(), {}), {
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state,
      });
    }
  };

  return {
    init: (cb) => {
      window.addEventListener("popstate", navigate);
      // window.addEventListener("pushstate", navigate);
      window.addEventListener("navigate", navigate);
      onRouteChange = cb || (() => {});
      onRouteChange(matchPath(currPath(), {}), {
        search: window.location.search,
        hash: window.location.hash,
        state: window.history.state,
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

let routeHandler = Router();

export const RouterAdv = ({ routeObj, _curPath }) => {
  const [curPath, setCurPath] = createState({ url: window.location.pathname });

  const onRouteChange = (newPath, routeConfig) => {
    console.log(newPath, routeConfig);
    setCurPath(newPath);
    // setCurPath(routerContext.get());
  };

  createEffect(() => {
    routeHandler.init(onRouteChange);
    return () => {
      routeHandler.cleanup();
    };
  }, []);

  // const routeKeys = Object.keys(routeObj);

  // for (let i = 0; i < routeKeys.length; i++) {
  //   const path = routeKeys[i];
  //   const match = matchPath(curPath?.url, {
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
  const finalUrl = _curPath?.url || curPath?.url;
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
