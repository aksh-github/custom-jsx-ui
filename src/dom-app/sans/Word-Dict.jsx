import { h } from "../../utils/vdom/vdom-lib";
import "./worddict.css";

const buttons = [
  { value: "a", label: "अ" },
  { value: "aa", label: "आ" },
  { value: "i", label: "इ" },
  { value: "ii", label: "ई" },
];

export function WordDict({ toggle, onClose }) {
  return (
    <div id="chat-widget">
      <div id="chat-box" className={toggle ? "show" : ""}>
        <div className="chat-header">
          <h4>Chat Support</h4>
          <button id="close-chat" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <div className="chat-body">
          <p>Sample chat message.</p>
        </div>
        <div className="chat-footer">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
          />
          <button className="send-btn">Send</button>
        </div>
      </div>
    </div>
  );
}
