import { h, createEffect } from "@vdom-lib";

export function ServerData(props) {
  //   console.log(props);
  // if (!props.data) return null;

  createEffect(() => {
    if (!props.data) {
      console.log("need to call api");
    }
    fetch("http://localhost:8080")
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [props?.data]);

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
