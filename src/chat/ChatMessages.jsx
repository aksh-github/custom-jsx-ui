import { h, onMount } from "../utils/vdom/vdom-lib";
import { createSignal, createEffect } from "../utils/signal-complex";

const getLatestDate = () => {
  const dt = new Date();
  const m = dt.getMinutes();
  const _date = dt.getHours() + (m < 10 ? ":0" : ":") + m;
  // setDate(_date);
  console.log(_date);
  return _date;
};

const My = () => {
  const dt = getLatestDate();
  return (props) => {
    return (
      <div class="me w3-animate-bottom">
        {props.type === "img" ? (
          <img
            style={{ width: "100%" }}
            src={props.message}
            class="image-msg"
          />
        ) : (
          <span>{props.message}</span>
        )}
        {/* <span>{props.message}</span> */}

        <div class="dateRecieved">{dt}</div>
      </div>
    );
  };
};

const Other = () => {
  const dt = getLatestDate();
  return (props) => {
    return (
      <div class="other w3-animate-top">
        {/* <div style={{ "font-size": "smaller" }}>{props.from === "me" ? "" : props.from}</div> */}
        {props.from && (
          <div style={{ "font-size": "smaller" }}>
            <img src="/avatar6.png" class="avatar" /> {props.from}
          </div>
        )}
        {props.type === "img" ? (
          <img
            style={{ width: "100%" }}
            src={props.message}
            class="image-msg"
          />
        ) : (
          <span>{props.message}</span>
        )}
        <div class="dateRecieved">{dt}</div>
        {props.type === "img" ? (
          <div class="">
            <a href="#" class="some" title="Download" onClick={downloadClicked}>
              <img height="28px" src="download.svg" alt="Download image" />
            </a>
          </div>
        ) : null}
      </div>
    );
  };
};

const ChatMessages = () => {
  return (props) => {
    // console.log(props);
    return (
      <div class="messages" style={{ padding: "0 1em" }}>
        {props?.messages?.map((item, i) => {
          //   console.log(item);
          let skipFlag = false;
          if (i !== 0) {
            // console.log(item.from, i());
            if (props.messages[i].from === props.messages[i - 1].from)
              skipFlag = true;
          }

          return item.from == "me" ? (
            <My {...item} />
          ) : item.from == "system" ? (
            <Notification {...item} />
          ) : (
            <Other
              message={item.message}
              from={skipFlag ? "" : item.from}
              type={item.type}
            />
          );
        })}
      </div>
    );
  };
};
export default ChatMessages;
