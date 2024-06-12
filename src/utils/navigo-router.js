import Navigo from "navigo"; // When using ES modules.

const NavigoRouter = (routeObj, cb) => {
  const _router = new Navigo(routeObj.basePath || "/");

  routeObj?.routes.forEach((ro) => {
    // console.log(ro);
    _router.on(ro.path, (match) => {
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

  return _router;
};

export default NavigoRouter;
