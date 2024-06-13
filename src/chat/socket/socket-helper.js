import { Socket, io } from "socket.io-client";
import { appState, isOnline, setEnable, socketState } from "../state-helper";
import { decryptText, encryptText } from "../utils";

// const url=`https://solid-chat.onrender.com`
const url = `http://${window.location.hostname}:3030`;

export let socket = null;

export function SocketHelper() {
  //   let socket;
  if (!socket || socket.disconnected) {
    socket = io(url, {
      query: { user: appState.get().user, room: appState.get().room },
      reconnectionAttempts: 5,
      timeout: 4000,
      // autoConnect: true,
    });
    // socketState.set({
    //   socket: socket,
    // });
  }

  socket?.on("connect", () => {
    // console.log(socket?.id); // x8WIv7-mJelg7on_ALbx
    // setMe(socket?.id || "");
    setEnable(true);
    isOnline(true);
    // console.log('need to set chatSmiley here');
  });

  socket?.on("disconnect", () => {
    console.log(socket?.id); // undefined
    isOnline(false);
  });

  socket.on("new_message", (data) => {
    const decrypted = decryptText(data, socketState.get().publicKey) || "";
    let message = null;
    try {
      message = JSON.parse(decrypted);
    } catch (err) {
      console.log("Error parsing the data");
      console.log("===========================");
      return;
    }

    // console.log(decrypted);
    //   setMessages([...messages(), message]);
    appState.set({
      messages: [...appState.get().messages, message],
      to: message.from,
    });
    // setTo(message.from);
  });

  socket.on("new_image", (data) => {
    // for perf checking
    const dt = new Date();
    console.log(dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds());
    // for perf checking end

    const decrypted = decryptText(data, socketState.get().publicKey) || "";
    let message = null;
    try {
      message = JSON.parse(decrypted);
    } catch (err) {
      console.log("Error parsing the data");
      console.log("===========================");
      return;
    }

    // console.log(decrypted);
    // setMessages([...messages(), message]);
    appState.set({
      messages: [...appState.get().messages, message],
      to: message.from,
    });
    // setTo(message.from);
  });

  socket.on("_", (data) => {
    // publicKey = data.publicKey;
    socketState.set({
      publicKey: data.publicKey,
    });
    // uuserId = data.uuserId
    console.log(socket);
    socket.uuserId = data.uuserId;
  });

  socket.on("new_user", (data) => {
    // console.log(store.user, data)

    // setUser(data.newUser)

    if (appState.get().to !== data.newUser)
      appState.set({
        messages: [
          ...appState.get().messages,
          {
            from: "system",
            message: data.newUser + " joined the chat",
            type: "notification",
          },
        ],
      });

    // console.log(store)
  });

  socket.on("user_exit", (data) => {
    console.log(data);

    appState.set({
      messages: [
        ...appState.get().messages,
        {
          from: "system",
          message: data.userExit + " left the chat",
          type: "notification",
        },
      ],
    });
  });
}

export const cleanUp = () => {
  socket?.off("connect");
  socket?.off("new_message");
  socket?.off("new_image");
  socket?.off("_");
  socket?.off("disconnect");
  socket?.off("new_user");
  socket?.off("user_exit");
  // socket?.close();
  // setEnable(false);
};

export const sendMessage = (msg, _file, to) => {
  // focusText();   //this was not working!!
  // (messageText as HTMLElement)?.focus();

  // console.log(msg());

  if (!socket) {
    console.log("socket unavailable");
  }

  if (_file) {
    // console.log("handle img", _file);

    const encrypted = encryptText(
      JSON.stringify({
        // from: me(),

        message: _file,
        from: appState.get("user"),
        to: appState.get("to"),
        toRoom: appState.get("room"),
        user: appState.get("user"),

        type: "img",
      }),
      socketState.get().publicKey
    );

    // console.log(encrypted);

    // for perf checking
    const dt = new Date();
    console.log(dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds());
    // for perf checking

    socket?.emit("new_image", encrypted);

    appState.set({
      messages: [
        ...appState.get().messages,
        { from: "me", message: _file, type: "img" },
      ],
    });
    return;
  }

  const encrypted = encryptText(
    JSON.stringify({
      // from: me(),
      from: appState.get("user"),
      to: appState.get("to"),
      toRoom: appState.get("room"),
      user: appState.get("user"),
      message: msg,
    }),
    socketState.get().publicKey
  );
  // console.log(encrypted);

  socket?.emit("new_message", encrypted);
  // setMessages([...messages(), { from: "me", message: msg() }]);
  appState.set({
    messages: [...appState.get().messages, { from: "me", message: msg }],
  });
  // scrollToBottom();
};
