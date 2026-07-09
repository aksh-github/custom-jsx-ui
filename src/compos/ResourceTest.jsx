import { h, createState, skipUpdate, createResource } from "@vdom-lib";
import { getTextAreaCompo } from "./DynamicExports";

const fetchUserData = () =>
  // new Promise((res) => setTimeout(() => res({ name: "Alice" }), 12000));
  fetch("http://localhost:8080")
    .then((res) => res.json())
    .catch((err) => err);

export function ResourceTest(params) {
  const [c, setc] = createState(0);
  const data = createResource(() => fetchUserData(), [c < 2 ? c : 10]);

  const Mod = createResource(() => getTextAreaCompo());

  console.log(data);

  // let data = [
  //   {
  //     userId: 1,
  //     id: 1,
  //     title:
  //       "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  //     body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
  //   },
  // ];

  // console.log(data, Mod);

  // {data?.loading ? <p>Loading...</p> : null}
  // {data?.error ? <p>Something wrong...</p> : null}

  return (
    <div>
      <p>
        {c}
        <button onClick={() => setc((_c) => _c + 1)}>+</button>
      </p>
      {/* <p>Resolved val: {JSON.stringify(value)}</p> */}

      {data?.loading ? <p>Loading...</p> : null}
      {data?.error ? <p>Something wrong...</p> : null}
      <ul>
        {data?.result?.resp.map((el) => {
          return (
            <li>
              {el.id}: {el.title}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
