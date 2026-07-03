import { h, createEffect, createState, createStream } from "@vdom-lib";

const transformResponse = (_, delta) => {
  // console.log(delta);
  // sett(delta.ts);
  return JSON.stringify(delta);
};

const StockStream = () => {
  const stokStream = createStream({ topic: "stock" });
  createEffect(() => {
    if (stokStream)
      stokStream.start(
        // (prevChunk, delta) => prevChunk + " " + delta.word,
        (prev, delta) => delta?.data?.value || 0,
        true,
      );
  }, []);

  return (
    <section>
      {" "}
      <h3>Stock Tracker</h3>
      <p>ABC: {stokStream?.result}</p>
    </section>
  );
};

const TimeStream = () => {
  const tstream = createStream({ topic: "time" });

  createEffect(() => {
    if (tstream)
      tstream.start(
        // (prevChunk, delta) => prevChunk + " " + delta.word,
        transformResponse,
        true,
      );
  }, []);

  return (
    <div>
      <p>{tstream?.result}</p>
      <p>
        <button onClick={() => tstream?.start(transformResponse, true)}>
          Start ▶️
        </button>
        <button onClick={() => tstream?.stop()}>Stop ⏹️</button>
      </p>
    </div>
  );
};

const ChatScreen = () => {
  const stream = createStream({ topic: "chat" });

  return "Streams";
};

export const Page = (props) => {
  // console.log(props);
  const data = props?.data;
  const [c, setc] = createState(0);

  createEffect(() => {
    if (!props?.data) {
      console.log("need to call api");
    }
  }, [props?.data]);

  return (
    <main>
      <h1>Streams</h1>
      <hr />

      <TimeStream />

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

      <hr />
      <StockStream />
    </main>
  );
};
