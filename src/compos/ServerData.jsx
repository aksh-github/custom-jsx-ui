import { h } from "@vdom-lib";

export function ServerData(props) {
  //   console.log(props);
  // if (!props.data) return null;

  return (
    <section>
      <h1>Server Data Example</h1>
      <ul>
        {props?.data?.resp.map((item, idx) => {
          return <li key={`k${item.id}`}>{item.title}</li>;
        })}
      </ul>
    </section>
  );
}
