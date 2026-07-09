import {
  h,
  createEffect,
  createState,
  createStream,
  skipUpdate,
} from "@vdom-lib";

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
      <h3>Stock Tracker</h3>
      <p>ABC: {stokStream?.result}</p>
    </section>
  );
};

const FileStream = () => {
  const fstream = createStream({ topic: "file" });

  createEffect(() => {
    if (fstream)
      fstream.start((prevChunk, delta) => {
        if (delta?.type === "word") {
          // console.log(prevChunk, delta);
          return (prevChunk || "") + " " + delta?.data?.word;
        } else if (delta?.type === "end") {
          // console.log(prevChunk, delta);
          // at this point prevChunk is the final output
          // skipUpdate(() => {
          //   fstream.stop(true);
          // });
          fstream.stop();
        }
        return prevChunk;
      }, true);
  }, []);

  return (
    <section>
      <h3>Streaming File</h3>
      {fstream?.loading ? (
        <p>
          <span className="typing"></span>
          <span className="typing"></span>
          <span className="typing"></span>
        </p>
      ) : null}
      <span style={{ background: "beige" }}>{fstream?.result}</span>
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

const url = "http://localhost:8787/messages";
const from = crypto.randomUUID().substring(4, 10);

const ChatScreen = () => {
  const [allMsgs, setAllMsgs] = createState([]);
  const stream = createStream({ topic: "chat" });
  const [msg, setMsg] = createState("");

  // console.log(allMsgs);

  const postMessage = async () => {
    setMsg("");
    const data = { from, message: msg };

    try {
      const response = await fetch(url, {
        method: "POST", // Specify the HTTP method
        headers: {
          "Content-Type": "application/json", // Inform the server about the data type
        },
        body: JSON.stringify(data), // Convert JavaScript object to JSON string
      });

      // fetch() resolves even on 404 or 500 errors; always check response.ok
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json(); // Parse the response body as JSON
      console.log("Success:", result);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  createEffect(() => {
    //     {
    //     "type": "chat-message",
    //     "topic": "chat",
    //     "data": {
    //         "message": {
    //             "from": "d878-4",
    //             "message": "hello"
    //         }
    //     },
    //     "ts": 1783080836297
    // }
    stream.start((prev, delta) => {
      if (delta?.type === "chat-message") {
        // console.log(prev, delta);
        console.log(allMsgs);
        setAllMsgs((_allMsgs) => [..._allMsgs, delta?.data?.message]);
        return delta?.data?.message;
      } else if (delta?.type === "chat-snapshot") {
        setAllMsgs([...delta?.data?.messages]);
      } else {
        return null;
      }
    }, true);
  }, []);

  return (
    <div>
      <div className="messages">
        {allMsgs.map((m, idx) => {
          return <p key={`m${idx}`}>{m.message}</p>;
        })}
      </div>
      <div className="edit">
        <textarea
          value={msg}
          onChange={(e) => {
            setMsg(e.target.value);
          }}
        ></textarea>
        <button onClick={postMessage}>&gt;</button>
      </div>
    </div>
  );
};

const ComponentStream = () => {
  const compStream = createStream({ topic: "component" });
  const [result, setResult] = createState(null);

  if (!result) {
    if (compStream)
      compStream.start((prevChunk, delta) => {
        if (delta?.type === "part") {
          console.log(prevChunk, delta);
          return { ...delta?.data };
        } else if (delta?.type === "end") {
          console.log(prevChunk, delta);
          // at this point prevChunk is the final output
          // skipUpdate(() => {
          //   compStream.stop(true);
          // });
          setResult(prevChunk.all);
          compStream.stop();
        }
        return prevChunk?.all ? structuredClone(prevChunk.all) : null;
      }, true);
  }

  // createEffect(() => {
  //   if (compStream)
  //     compStream.start((prevChunk, delta) => {
  //       if (delta?.type === "part") {
  //         console.log(prevChunk, delta);
  //         return { ...delta?.data };
  //       } else if (delta?.type === "end") {
  //         console.log(prevChunk, delta);
  //         // at this point prevChunk is the final output
  //         // skipUpdate(() => {
  //         //   compStream.stop(true);
  //         // });
  //         setResult(prevChunk.all);
  //         compStream.stop();
  //       }
  //       return prevChunk?.all ? structuredClone(prevChunk.all) : null;
  //     }, true);
  // }, []);

  // console.log(result);

  return (
    <section>
      <h3>Streaming Component</h3>
      {compStream?.loading ? (
        <section>
          <p>
            <span className="typing"></span>
          </p>
          <p>
            <span className="typing"></span>
          </p>
          <p>
            <span className="typing"></span>
          </p>
        </section>
      ) : null}
      {/* {compStream ? { ...compStream.result } : null} */}
      {result ? structuredClone(result).map((el) => el) : null}
      {/* {result ? result.map((el) => el) : null} */}
    </section>
  );
};

export const Stream = () => {
  // console.log(props);
  const [c, setc] = createState(0);

  return (
    <main>
      <h1>Streams</h1>

      <ComponentStream />

      <p>{c}</p>
      <button onClick={() => setc((c) => c - 1)}>-</button>
      <button onClick={() => setc((c) => c + 1)}>+</button>

      <hr />
      <StockStream />
      <hr />
      <FileStream />
      <hr />
      <ChatScreen />
      <hr />
      <TimeStream />
    </main>
  );
};
