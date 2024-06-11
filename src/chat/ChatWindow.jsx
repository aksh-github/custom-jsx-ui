import { h, onMount } from "../utils/vdom/vdom-lib";
import { createSignal, createEffect } from "../utils/signal-complex";
// import { generateCaptcha } from "../utils/utils";

import "./index.css";
import "./welcome.css";
import navigoRouter from "../utils/navigo-router";
import { appState } from "./state-helper";

const Header = (props) => () =>
  (
    <header>
      <div>
        <button onClick={() => navigoRouter.get().navigate("/")}>ᑉ</button>
      </div>
      <div>
        <span
          class="online"
          style={{ "background-color": props?.online ? "green" : "red" }}
        ></span>{" "}
        {appState.get("room")}
      </div>
      <div></div>
    </header>
  );

const FooterWrapper = (props) => {
  const ActionBar = () => () => <div className="actions">Action Bar</div>;
  const _Footer = () => () => <footer>Some footer</footer>;

  //   return () =>
  //     [ActionBar, _Footer].map((ele) => {
  //       return <ele />;
  //     });
  return () => (
    <div>
      <ActionBar />
      <_Footer />
    </div>
  );
};

const ChatMessages = (props) => () => <div>ChatMessages section....</div>;

export const ChatWindow = (props) => {
  let chatRowDiv;
  return () => (
    <div class="chat-container">
      <Header goBack={() => {}} online={true} />
      <div
        class="chat-row"
        ref={chatRowDiv}
        style={{ height: window.innerHeight }}
      >
        <ChatMessages
          messages={[] || store?.messages}
          newUser={appState.get("user")}
        />
      </div>
      {/* {!online() ? <div style={{ "text-align": "center" }}>Connecting...</div> : null} */}
      <FooterWrapper />
    </div>
  );
};
