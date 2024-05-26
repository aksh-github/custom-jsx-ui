import { dom } from "../utils/dom/lib";

const Link = (props) => {
  // console.log(props);
  return (props) => (
    <a
      href={props.href}
      data-navigo
      onClick={(e) => {
        e.preventDefault();
        return true;
      }}
    >
      {props.children}
    </a>
  );
};

export default Link;
