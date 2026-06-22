import { h, createEffect, createState } from "@vdom-lib";

export const Page = (props) => {
  console.log(props);
  const data = props?.data;

  const [c, setc] = createState(0);

  createEffect(() => {
    if (!props?.data) {
      console.log("need to call api");
    }
  }, [props?.data]);

  return (
    <main>
      <h1>Page 1</h1>
      <hr />
      <div>
        {true}
        {false}
        {null}
        {undefined}
      </div>
      {data?.resp.map((item) => {
        return (
          <div key={"k" + item.id}>
            <p>
              {item.id} {item.title}
            </p>
          </div>
        );
      })}
      <p>{c}</p>
      <button onClick={() => setc((c) => c - 1)}>-</button>

      <button onClick={() => setc((c) => c + 1)}>+</button>
    </main>
  );
};
