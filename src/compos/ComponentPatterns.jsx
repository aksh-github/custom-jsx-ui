// import { createEffect, createSignal } from "../utils/signal-complex";
import { signal } from "../utils/signal-v2";
import { h, createState, createEffect, skipUpdate } from "@vdom-lib";
import { routeHandler } from "../vdom-app/App";

export const TextArea = () => {
  // const [t, set] = atom("");

  const [t, set] = createState("");
  let txtRef;

  // onMount(() => {
  //   console.log(txtRef);
  //   setTimeout(() => {
  //     txtRef.focus();
  //   }, 100);
  // }, []);

  createEffect(() => {
    // if (txtRef) txtRef.focus();

    return () => {
      console.log("unmounting TextArea");
      txtRef = null;
    };
  }, []);

  console.log("came here");

  const clear = () => {
    set("");
    // settxt("");
  };

  return (
    <div style={{ backgroundColor: "beige" }}>
      <button onClick={clear}>Clear</button>
      {/* <br />
        <span>{txt()}</span>
        <textarea
          value={txt()}
          onInput={(e) => settxt(e.target.value)}
        ></textarea>
        <br /> */}
      <span>{t}</span>
      <input
        value={t}
        ref={(ta) => {
          txtRef = ta;
          // setTimeout(() => {
          //   ta.focus();
          // }, 100);
        }}
        onInput={(e) => set(e.target.value)}
      />
    </div>
  );
};

export const DoesNotWork = (props) => {
  console.log("This does NOT work");
  return <p>{props.p}</p>;
};

export const PropsDriven = (props) => {
  //   console.log(props);
  return <div style={{ backgroundColor: "beige" }}>{props.n}</div>;
};

export const ArrayWithoutMap = () => {
  console.log("If you try to change the array it won't work");
  // let arr = [<p>10</p>, <p>20</p>];
  const [arr, set] = signal([<p>10</p>, <p>20</p>]);

  // setTimeout(() => {
  //   console.log("exec");
  //   set([...arr(), <p>40</p>]);
  //   // set([arr().filter((_, idx) => idx !== 0)]);
  //   console.log(arr());
  // }, 4000);

  return () => ["some str", ...arr(), 100000];
};

export const ArrayWithMap = () => {
  console.log("If you try to change the array it won't work");
  // let arr = [<p>10</p>, <p>20</p>];
  const [arr, set] = createSignal([<p>10</p>, <p>20</p>]);

  // this definitelys wont work
  setTimeout(() => {
    console.log("exec");
    set([...arr(), <Row key={2} n={<p>40</p>} />]);
    // set([arr().filter((_, idx) => idx !== 0)]);
    console.log(arr());
  }, 4000);

  const Row =
    () =>
    ({ n }) =>
      n;

  return () => (
    <div>
      {arr().map((el, idx) => {
        return <Row key={idx} n={el} />;
      })}
    </div>
  );
};

// export const ArrayThatWorks = () => {
//   //   console.log("This does work");
//   console.log("This works as expected");
//   //   const arr = [<li>10</li>, <li>20</li>];
//   const Arr = state({ a: [<li>10</li>, <li>20</li>] });
//   return () => (
//     <div style={{ backgroundColor: "greenyellow" }}>
//       <button
//         onClick={() => {
//           Arr.set({ a: [...Arr.get("a"), <li>40</li>] });
//           console.log(Arr.get("a"));
//         }}
//       >
//         Update below Array
//       </button>
//       <button
//         onClick={() => {
//           Arr.set({
//             a: Arr.get("a").filter((el) => {
//               return false;
//             }),
//           });
//           console.log(Arr.get("a"));
//         }}
//       >
//         Filter below Array
//       </button>
//       <ul>
//         {Arr.get("a").map((el) => {
//           return el;
//         })}
//       </ul>
//     </div>
//   );
// };

export const ArrayWithFragments = (props) => {
  console.log("This works for only static, changes won't reflect", props?.some);

  const [st, setSt] = createState(null);

  setTimeout(() => {
    setSt("dynamic delayed value");
  }, 4000);

  const Row = ({ n }) => <p>{n}</p>;

  const arr = [1000, 2000];
  // return () => <p>10</p>;
  return (
    <df>
      {/* <p>10</p>
      <p>20</p> */}
      {st}
      <p>time is {props?.some}</p>
      <button
        onClick={() => {
          // alert("prog'matic navigatiion to be implemented");
          routeHandler.navigator.go("/sans", { a: 10 });
        }}
      >
        Go to simple
      </button>
      {arr.map((el, idx) => {
        return <Row key={idx} n={el} />;
      })}
      {st}
    </df>
  );
};

export const ArrayWithFragmentsComplex = () => {
  console.log("This works for only static, changes won't reflect");
  // const arr = [<p>1000</p>, <p>20000</p>];
  // return () => <p>10</p>;
  return () => (
    <df>
      <p>10</p>
      <div>
        <h2>some complex</h2>
        <h2>some complex2</h2>
      </div>
      <p>20</p>
      {/* {arr} */}
    </df>
  );
};

const Gist = () => {
  const [gistContent, setGistContent] = createState("");
  let divRef = null;
  let mermdRef = null;

  createEffect(() => {
    // console.log("divRef", divRef)

    if (mermdRef) {
      mermdRef.innerHTML = `<script type="text/markdown">
\`\`\`mermaid
---
title: "TCP Packet"
---
packet-beta
0-15: "Source Port" 
16-31: "Destination Port"
  32-63: "Sequence Number"
  64-95: "Acknowledgment Number"
  96-99: "Data Offset"
  100-105: "Reserved"
  106: "URG"
  107: "ACK"
  108: "PSH"
  109: "RST"
  110: "SYN"
  111: "FIN"
  112-127: "Window"
  128-143: "Checksum"
  144-159: "Urgent Pointer"
  160-191: "(Options and Padding)"
  192-255: "Data (variable length)"

\`\`\`
</script>`;
    }

    fetch("https://api.github.com/gists/3535c82ef14db4120481951f71c8df89")
      .then((response) => response.json())
      .then((data) => {
        console.log("Gist data:", data);
        const file = data.files["README.md"];
        if (file) {
          setGistContent(file.content);
          if (divRef) {
            divRef.innerHTML = `<script type="text/markdown">
          ${file.content}
        </script>`;
          }
        } else {
          console.error("File not found in the gist");
        }
      })
      .catch((error) => {
        console.error("Error fetching gist:", error);
      });

    return () => {
      console.log("unmounting Gist");
      if (divRef) {
        divRef.innerHTML = "";
      }
      if (mermdRef) {
        mermdRef.innerHTML = "";
      }
      mermdRef = divRef = null;
    };
  }, []);

  return (
    <div>
      <pre>{gistContent}</pre>

      <zero-md
        ref={(el) => {
          mermdRef = el;
        }}
      ></zero-md>

      <zero-md
        ref={(el) => {
          divRef = el;
        }}
      ></zero-md>
      {/* <iframe
          src="https://gist.github.com/jherr/3535c82ef14db4120481951f71c8df89.js"
          width="100%"
          height="500"
        ></iframe> */}
    </div>
  );
};

const SseComp = () => {
  let zmdRef = null;
  let data = "";
  let scriptEl;

  createEffect(() => {
    let source = new EventSource("http://localhost:8000/events");

    // build, attach script el
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.setAttribute("type", "text/markdown");
      zmdRef.appendChild(scriptEl);
    }

    source.onmessage = (event) => {
      const markdownData = event.data;
      // console.log(event);

      data += markdownData + "\n";
      // console.log(data);
      if (zmdRef && scriptEl) {
        scriptEl.textContent = data;
      }
    };

    source.onerror = (e) => {
      console.log("Error occurred while connecting to SSE endpoint.", e);
      source.close();
    };

    source.onopen = () => {
      console.log("Connected to SSE endpoint.");
    };

    // Cleanup function
    return () => {
      console.log("Cleaning up SSE connection");
      if (source) {
        source.close();
        source = null;
      }
      zmdRef = null;
    };
  }, []);

  return (
    <zero-md
      ref={(el) => {
        zmdRef = el;
      }}
    ></zero-md>
  );
};

export const Embed = () => {
  const [yt, setYt] = createState("HwUyhqQCA5Q");

  return (
    <div>
      <h2>Embed</h2>
      <SseComp />
      <input
        type="text"
        value={yt}
        onChange={(e) => {
          // console.log(e, e.target.value);
          setYt(e.target.value);
        }}
      />
      <iframe
        width="100%"
        height="615"
        src={`https://www.youtube.com/embed/${yt}`}
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <hr />
      <Gist />
      <hr />
      <zero-md src="https://raw.githubusercontent.com/aksh-github/pages/refs/heads/master/data/sanskrit/intro.md"></zero-md>
    </div>
  );
};
