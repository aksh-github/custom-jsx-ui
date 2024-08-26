// import { SimpleSwitch } from "../compos/Switch";
import { LinkV2, Route, Router, SimpleSwitch } from "../utils/router-v2";
import { atom, registerCallback, state } from "../utils/simple-state";
import {
  mount,
  h,
  forceUpdate,
  onMount,
  onCleanup,
} from "../utils/vdom/vdom-lib";

const Home = () => () => <h2>Home</h2>;
const About = () => () => <h2>About</h2>;
const Topic =
  () =>
  ({ topicId }) =>
    <h3>{topicId}</h3>;

const Topics = (p) => {
  const items = [
    { name: "Props v. State", slug: "props-v-state" },
    { name: "Rendering with React", slug: "rendering" },
    { name: "Components", slug: "components" },
  ];
  // console.log(p);

  return (props) => {
    // console.log(curPath.get());
    const { basepath, match } = props;

    const item = items.find(({ name, slug }) => {
      return match?.url?.endsWith(slug);
    });

    console.log(item);

    return (
      <div>
        <h2>Topics</h2>
        <ul>
          {items.map(({ name, slug }) => (
            <li key={name}>
              <LinkV2 to={`${basepath}/${slug}`}>{name}</LinkV2>
            </li>
          ))}
        </ul>
        {items.map(({ name, slug }) => (
          <Route
            key={name}
            path={`${match.path}/${slug}`}
            render={() => <Topic topicId={name} />}
          />
        ))}
        <Route
          exact
          path={match.url}
          render={() => <h3>Please select a topic.</h3>}
        />

        {/* <Topic topicId={(item?.name || "") + " on " + match.url} /> */}
      </div>
    );
  };
};

function App() {
  // const [curPath, setCurPath] = state(window.location.pathname);

  // const onRouteChange = (newPath) => {
  //   console.log(newPath);
  //   setCurPath(newPath);
  // };
  // let routeHandler = Router();

  // onMount(() => {
  //   routeHandler.init(onRouteChange);
  // });

  // onCleanup(() => {
  //   routeHandler.cleanup();
  // });

  return () => (
    <div>
      <ul>
        <li>
          <LinkV2 to="/">Home</LinkV2>
        </li>
        <li>
          <LinkV2 to="/about">About</LinkV2>
        </li>
        <li>
          <LinkV2 to="/topics">Topics</LinkV2>
        </li>
      </ul>

      <hr />

      {/* {(() => {
        console.log("this works 25aug");
        switch (curPath("url")) {
          // switch (route()) {
          case "/about":
            return <About />;
          case "/":
            return <Home />;
          // case "/topics":
          //   return <Topics match={curPath.get()} />;
          default:
            if (curPath("url")?.startsWith("/topics"))
              return <Topics basepath="/topics" match={curPath()} />;
            else return "Wrong path 404";
        }
      })()} */}

      <Route exact path="/" render={() => <Home />} />
      <Route path="/about" render={() => <About />} />
      <Route
        path="/topics"
        render={(props) => {
          console.log(props);
          return <Topics basepath="/topics" {...props} />;
        }}
      />

      {/* <SimpleSwitch>
        <SimpleSwitch.Case
          path={"/topics"}
          render={(props) => {
            console.log(props);
            return <Topics basepath="/topics" {...props} />;
          }}
        />
        <SimpleSwitch.Case path={"/about"} render={() => <About />} />
        <SimpleSwitch.Case path={"/"} render={() => <Home />} />
        <SimpleSwitch.Case
          render={(props) => {
            // if (curPath("url")?.startsWith("/topics"))
            //   return <Topics basepath="/topics" match={curPath()} />;
            // else
            console.log(props);
            return "Wrong path 404";
          }}
        />
      </SimpleSwitch> */}
    </div>
  );
}

// for my state
registerCallback(forceUpdate);

const root = document.getElementById("root-vdom");
mount(root, () => <App />);
