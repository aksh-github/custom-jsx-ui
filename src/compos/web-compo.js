class HoleComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    // Create content for the shadow DOM
    const wrapper = document.createElement("div");
    wrapper.textContent = "Hello from Web Component!";
    wrapper.style.color = "blue";

    shadow.appendChild(wrapper);
  }

  connectedCallback() {
    console.log("Web Component mounted!");
  }

  disconnectedCallback() {
    console.log("Web Component unmounted!");
  }

  // Allow React to pass props as attributes
  static get observedAttributes() {
    return ["message"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "message") {
      this.shadowRoot.querySelector("div").textContent = newValue;
    }
  }
}

export default HoleComponent;

// Register the Web Component
customElements.define("hole-component", HoleComponent);
