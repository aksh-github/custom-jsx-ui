import { h, onMount } from "../utils/vdom/vdom-lib";
import { createSignal, createEffect } from "../utils/signal-complex";
import {
  compressImage,
  decryptText,
  encryptText,
  getFileSize,
  getImageDimensions,
} from "./utils";
import navigoRouter from "../utils/navigo-router";
import { appState } from "./state-helper";
import ChatMessages from "./ChatMessages";

import { createPopup } from "@picmo/popup-picker";

let publicKey = "";

const Header = (props) => () =>
  (
    <header>
      <div>
        <button onClick={() => navigoRouter.get().navigate("/")}>ᑉ</button>
      </div>
      <div>
        <span
          className="online"
          style={{ "background-color": props?.online ? "green" : "red" }}
        ></span>{" "}
        {appState.get("room")}
      </div>
      <div></div>
    </header>
  );

const Footer = (props) => {
  let textareaRef = null;
  const decide = () => {
    return !props?.msg();
    // return false;
  };

  return () => {
    return (
      <footer>
        <form>
          <textarea
            ref={(ref) => {
              textareaRef = ref;
            }}
            rows={3}
            value={props?.msg()}
            placeholder="Type your message...(Shft + Enter for next line)"
            onInput={(e) => {
              let v = e.target.value;
              v = v?.trim();
              props?.setMsg(e.target.value);
            }}
          >
            {props?.msg()}
          </textarea>
          <button
            type="submit"
            disabled={decide()}
            onClick={(e) => {
              e?.preventDefault();
              props?.sendMessage();
              if (textareaRef) {
                textareaRef.value = "";
                textareaRef.focus();
              }
            }}
          >
            <div className="wrapper">➤</div>
          </button>
        </form>
      </footer>
    );
  };
};

const ActionBar = (props) => {
  return () =>
    props?.online ? (
      <div className="actions">
        <div className="file-input">
          <input
            type="file"
            name="file-input"
            id="file-input"
            className="file-input__input"
            accept="image/*"
            onChange={props?.onFileChange}
          />
          <label className="file-input__label" for="file-input">
            <svg
              aria-hidden="true"
              // focusable="false"
              data-prefix="fas"
              data-icon="upload"
              className="svg-inline--fa fa-upload fa-w-16"
              // role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M296 384h-80c-13.3 0-24-10.7-24-24V192h-87.7c-17.8 0-26.7-21.5-14.1-34.1L242.3 5.7c7.5-7.5 19.8-7.5 27.3 0l152.2 152.2c12.6 12.6 3.7 34.1-14.1 34.1H320v168c0 13.3-10.7 24-24 24zm216-8v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h136v8c0 30.9 25.1 56 56 56h80c30.9 0 56-25.1 56-56v-8h136c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"
              ></path>
            </svg>
          </label>
        </div>
        <div
          ref={(ref) => {
            props?.setCSRef(ref);
          }}
          className="pickerContainer"
        >
          <button
            className="smileyButton"
            ref={(ref) => props?.setBtnRef(ref)}
            onClick={props?.smileyClicked}
            id="emoji-button"
          >
            😀
          </button>
        </div>
      </div>
    ) : (
      <div style={{ "text-align": "center" }}>Connecting...</div>
    );
};

const sendMessage = (msg, _file, to) => {
  // focusText();   //this was not working!!
  // (messageText as HTMLElement)?.focus();

  // console.log(msg());

  if (_file) {
    // console.log("handle img", _file);

    const encrypted =
      (JSON.stringify({
        // from: me(),

        message: _file,
        from: appState.get("user"),
        to: to(),
        toRoom: appState.get("room"),
        user: appState.get("user"),

        type: "img",
      }),
      publicKey);

    // console.log(encrypted);

    // for perf checking
    const dt = new Date();
    console.log(dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds());
    // for perf checking

    // socket?.emit("new_image", encrypted);

    appState.set({
      messages: [
        ...appState.get().messages,
        { from: "me", message: _file, type: "img" },
      ],
    });
    return;
  }

  const encrypted =
    (JSON.stringify({
      // from: me(),
      from: appState.get("user"),
      to: to(),
      toRoom: appState.get("room"),
      user: appState.get("user"),
      message: msg(),
    }),
    publicKey);
  // console.log(encrypted);

  // socket?.emit("new_message", encrypted);
  // setMessages([...messages(), { from: "me", message: msg() }]);
  appState.set({
    messages: [...appState.get().messages, { from: "me", message: msg() }],
  });
  // scrollToBottom();
};

export const ChatWindow = (props) => {
  // imp things first
  if (!appState.get("room")) {
    console.log("basic values missing");
    navigoRouter.get().navigate("/");
  }

  let chatRowDiv, chatSmiley, picker, btn;

  const [enable, setEnable] = createSignal(false);
  // const [me, setMe] = createSignal("");
  const [to, setTo] = createSignal("");
  const [msg, setMsg] = createSignal("");
  const [online, isOnline] = createSignal(false);

  onMount(() => {
    if (!picker) createAPopup();
  });

  const createAPopup = () => {
    // emoji stuff

    picker = createPopup(
      {
        // picker options go here
        // rootElement: chatSmiley,
        categories: ["recents", "smileys-emotion", "people-body"],
        emojiSize: "1.5rem",
        showPreview: false,
        showSearch: false,
      },
      {
        referenceElement: chatSmiley,
        triggerElement: btn,
        position: "top",
        hideOnEmojiSelect: false,
      }
    );

    picker.addEventListener("emoji:select", (data) => {
      // console.log(data);
      setMsg(msg() + data.emoji);
    });
  };

  const smileyClicked = () => {
    picker?.toggle();
  };

  const onFileChange = async (event) => {
    const _file = event?.target?.files[0];

    console.log(
      _file.size > 10240000 ? ">10MB" : "ok",
      getFileSize(_file.size)
    );

    if (_file.size > 10240000) {
      console.log("File too large");
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(_file);

    //get the dimensions of the input image
    const { height, width } = await getImageDimensions(img);

    const MAX_WIDTH = 1024; //if we resize by width, this is the max width of compressed image
    const MAX_HEIGHT = 1024; //if we resize by height, this is the max height of the compressed image

    const widthRatioBlob = await compressImage(
      img,
      MAX_WIDTH / width,
      width,
      height
    );
    const heightRatioBlob = await compressImage(
      img,
      MAX_HEIGHT / height,
      width,
      height
    );

    let compressedBlob = null;

    //pick the smaller blob between both
    if (widthRatioBlob && heightRatioBlob)
      compressedBlob =
        widthRatioBlob.size > heightRatioBlob.size
          ? heightRatioBlob
          : widthRatioBlob;

    if (compressedBlob) {
      // console.log("do further processing", compressedBlob);

      const optimalBlob =
        compressedBlob.size < _file.size ? compressedBlob : _file;
      // console.log(`Inital Size: ${_file.size}. Compressed Size: ${optimalBlob.size}`);

      const reader = new FileReader();
      reader.onload = (event) => {
        const bytes = event?.target?.result;
        // console.log(bytes);

        if (bytes) sendMessage(null, bytes, to);
        // socket.emit("image", bytes);
        setMsg("");
      };
      reader.readAsDataURL(optimalBlob);
    } else {
      console.log("something wrong!!");
    }
  };

  return () => (
    <div className="chat-container">
      <Header online={true} />
      <div
        className="chat-row"
        ref={chatRowDiv}
        style={{ height: window.innerHeight }}
      >
        <ChatMessages
          messages={appState.get("messages")}
          newUser={appState.get("user")}
        />
      </div>
      {/* {!online() ? <div style={{ "text-align": "center" }}>Connecting...</div> : null} */}
      <ActionBar
        online={true}
        setBtnRef={(ref) => (btn = ref)}
        setCSRef={(ref) => (chatSmiley = ref)}
        onFileChange={(e) => onFileChange(e)}
        setMsg={setMsg}
        smileyClicked={smileyClicked}
      />
      <Footer
        msg={msg}
        setMsg={setMsg}
        enable={true}
        sendMessage={(e) => {
          sendMessage(msg, null, to);
          setMsg("");
        }}
      />
    </div>
  );
};
