// router impl
// https://dcode.domenade.com/tutorials/build-a-single-page-app-with-javascript-no-frameworks
// https://github.com/dcode-youtube/single-page-app-vanilla-js

const router = (_routes, cbFunc) => {
  const { routes } = _routes;
  const pathToRegex = (path) =>
    new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

  const getParams = (match) => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
      (result) => result[1]
    );

    return Object.fromEntries(
      keys.map((key, i) => {
        return [key, values[i]];
      })
    );
  };

  const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
  };

  const router = async () => {
    // Test each route for potential match
    const potentialMatches = routes.map((route) => {
      return {
        route: route,
        result: location.pathname.match(pathToRegex(route.path)),
      };
    });

    let match = potentialMatches.find(
      (potentialMatch) => potentialMatch.result !== null
    );

    if (!match) {
      match = {
        route: routes[0],
        result: [location.pathname],
      };
    }

    const Compo = match.route.component;

    console.log(match, getParams(match));

    // v imp step to release mem
    // release(document.querySelector("#root"));

    // innerHTML(document.querySelector("#root"), html`<${Compo} />`);
    cbFunc(Compo);
  };

  window.addEventListener("popstate", router);

  document.addEventListener("DOMContentLoaded", () => {
    console.log("domcontent loaded");

    document.body.addEventListener("click", (e) => {
      if (e.target.matches("[data-link]")) {
        // e.preventDefault();
        navigateTo(e.target.href);
      }
    });

    router();
  });
};

export default router;
