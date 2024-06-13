import { h, onMount } from "../utils/vdom/vdom-lib";
import { createSignal, createEffect } from "../utils/signal-complex";
import { saveBase64AsFile } from "./utils";

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
      <div className="me w3-animate-bottom">
        {props.type === "img" ? (
          <img src={props.message} className="image-msg" />
        ) : (
          <span>{props.message}</span>
        )}
        {/* <span>{props.message}</span> */}

        <div className="dateRecieved">{dt}</div>
      </div>
    );
  };
};

const Other = () => {
  const dt = getLatestDate();

  const downloadClicked = (event) => {
    const el = event.currentTarget;
    const divcontainer = el?.closest(".other");

    // console.log(divcontainer?.getElementsByClassName("image-msg")[0].src);

    const img = divcontainer?.getElementsByClassName("image-msg");

    const src = img[0] && img[0].src;

    if (src) saveBase64AsFile(src, `imgage-${Date.now()}.png`);
    else console.log("Image unavailable");
  };

  return (props) => {
    return (
      <div className="other w3-animate-top">
        {/* <div style={{ "font-size": "smaller" }}>{props.from === "me" ? "" : props.from}</div> */}
        {props.from && (
          <div style={{ "font-size": "smaller" }}>
            <img src="/avatar6.png" className="avatar" /> {props.from}
          </div>
        )}
        {props.type === "img" ? (
          <img src={props.message} className="image-msg" />
        ) : (
          <span>{props.message}</span>
        )}
        <div className="dateRecieved">{dt}</div>
        {props.type === "img" ? (
          <div className="" onClick={downloadClicked}>
            Download
            {/* <a href="#" className="some" title="Download" onClick={downloadClicked}>
              <img height="28px" src="download.svg" alt="Download image" />
            </a> */}
            {"\u21E9"}
          </div>
        ) : null}
      </div>
    );
  };
};

const Notification = (props) => {
  const dt = getLatestDate();

  return (
    <div className="notify w3-animate-bottom">
      <div className="dateRecieved" style={{ "text-align": "center" }}>
        {dt} {props.message}
      </div>
    </div>
  );
};

const ChatMessages = () => {
  return (props) => {
    // console.log(props);
    return (
      <div className="messages" style={{ padding: "0 1em" }}>
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
