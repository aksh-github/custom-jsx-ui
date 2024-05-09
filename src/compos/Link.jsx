import { dom } from "../utils/lib";

const Link = (props) => {
  console.log(props);
  return (
    <a
      href={props.href}
      data-link
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
