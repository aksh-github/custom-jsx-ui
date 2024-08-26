import { atom } from "./simple-state";
import { onCleanup, onMount, h } from "./vdom/vdom-lib";

console.log(
  "check: https://github.com/nanojsx/nano/blob/master/src/components/router.ts"
);
console.log(
  "check: https://codesandbox.io/s/build-own-react-router-v4-mpslz , https://www.youtube.com/watch?v=1knvu0a3k0w"
);

const historyPush = (path) => {
  window.history.pushState({}, null, path);
  //   instances.forEach((instance) => instance.forceUpdate());
  window.dispatchEvent(new PopStateEvent("navigate"));
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

const [currentPath, setCurentPath] = atom(window.location.pathname);

export function Route() {
  //   const currentPath = atom(window.location.pathname);

  const navigate = (abcd) => {
    console.log(window.location.pathname, abcd);
    if (currentPath() !== window.location.pathname)
      setCurentPath(window.location.pathname);
  };

  onMount(() => {
    window.addEventListener("popstate", navigate);
    window.addEventListener("navigate", navigate);
  });

  onCleanup(() => {
    window.removeEventListener("popstate", navigate);
    window.removeEventListener("navigate", navigate);
  });

  return (props) => {
    const { path, exact, component, render } = props;

    const match = matchPath(window.location.pathname, { path, exact });

    if (!match) return null;

    if (component) return h(component, { match });

    console.log(props);

    if (render) return render({ match });

    return null;
  };
}

export function LinkV2({ to, replace }) {
  const handleClick = (event) => {
    event.preventDefault();
    replace ? historyReplace(to) : historyPush(to);
  };

  return ({ to, children }) => {
    return (
      <a href={to} onClick={handleClick}>
        {children}
      </a>
    );
  };
}

export function Router() {
  const [currPath, setCurrPath] = atom(window.location.pathname);
  let onRouteChange;
  const navigate = (abcd) => {
    console.log(window.location.pathname, abcd);
    if (currPath() !== window.location.pathname) {
      setCurrPath(window.location.pathname);
      onRouteChange(matchPath(currPath(), {}));
    }
  };

  return {
    init: (cb) => {
      window.addEventListener("popstate", navigate);
      window.addEventListener("navigate", navigate);
      onRouteChange = cb || (() => {});
      onRouteChange(matchPath(currPath(), {}));
    },
    cleanup: () => {
      window.removeEventListener("popstate", navigate);
      window.removeEventListener("navigate", navigate);
    },
  };
}

export const SimpleSwitch = (pmain) => {
  const [curPath, setCurPath] = atom(window.location.pathname);

  console.log(pmain);

  const navigate = (abcd) => {
    console.log(window.location.pathname, abcd);
    if (curPath() !== window.location.pathname)
      setCurPath(window.location.pathname);
  };

  onMount(() => {
    window.addEventListener("popstate", navigate);
    window.addEventListener("navigate", navigate);
  });

  onCleanup(() => {
    window.removeEventListener("popstate", navigate);
    window.removeEventListener("navigate", navigate);
  });

  return (props) => {
    console.log(props);
    const { cond, children } = props;

    let defaultc = null;
    let match = null;

    const selected = children?.find((c) => {
      console.log(c);
      const { value } = c;

      if (value.path === undefined) defaultc = c;

      match = matchPath(window.location.pathname, {
        path: value.path,
        exact: value.exact,
      });
      // return mp ? true : false;
      return value.path === window.location.pathname;
    });

    console.log(selected);

    return (selected || defaultc)?.value?.render({ match });
  };
};

SimpleSwitch.Case = () => {
  return (props) => {
    const { path, render } = props;
    return { render, path };
  };
};
