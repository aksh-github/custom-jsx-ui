import Navigo from "navigo"; // When using ES modules.
import { onMount, h } from "./vdom/vdom-lib";

const NavigoRouter = () => {
  let _router = null;
  let _routeObj;

  return {
    set: (routeObj, cb) => {
      _router = new Navigo(routeObj.basePath || "/");
      _routeObj = routeObj;

      routeObj?.routes.forEach((ro) => {
        _router.on(ro.path, (match) => {
          // console.log(match);
          // if (match?.url === ro.path)
          cb(ro.component, match);
        });
      });

      _router.hooks({
        before(done, match) {
          // do something
          done();
        },
      });

      _router.resolve();
    },
    get: () => _router,
  };
};

export const navigoRouter = NavigoRouter();

// JSX Version

let router;

export function getRouter(root) {
  if (router) {
    return router;
  }

  router = new Navigo(root || "/", { strategy: "ALL", noMatchWarning: true });

  return router;
}

export const NavigoWrapper = ({ path, children }) => {
  onMount(() => {
    router.resolve();
  });

  return children;
};

// https://dev.to/musatov/conditional-rendering-in-react-with-a-switch-component-23ph
export const Switch = (props) => {
  console.log(props);
  // { condition, children }

  return (props) => {
    console.log(props);
    const { condition, children, when } = props;
    if (!children) {
      return null;
    }

    const arrayOfChildren = Array.isArray(children) ? children : [children];
    const cases = arrayOfChildren.filter(
      (child) => child.props.when == condition
    );

    console.log(cases[0]);
    return cases[0];
  };
};
