
// @copyright
//   © 2016-2022 Jarosław Foksa
// @license
//   MIT License (check LICENSE.md for details)

import Xel from "../classes/xel.js";

import {rectContainsPoint} from "../utils/math.js";
import {html, css} from "../utils/template.js";
import {getTimeStamp} from "../utils/time.js";

// @element x-notification
export default class XNotificationElement extends HTMLElement {
  static observedAttributes = ["opened", "size"];

  static #shadowTemplate = html`
    <template>
      <slot></slot>
    </template>
  `;

  static #shadowStyleSheet = css`
    :host {
      display: none;
      position: fixed;
      min-width: 15px;
      min-height: 15px;
      bottom: 15px;
      left: 50%;
      transform: translateX(-50%);
      padding: 5px 12px;
      box-sizing: border-box;
      color: rgba(255, 255, 255, 0.9);
      background: #434343;
      z-index: 9999;
      font-size: 12px;
      user-select: text;
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host([opened]),
    :host([animating]) {
      display: block;
    }
    :host(:focus) {
      outline: none;
    }
  `

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @property
  // @attribute
  // @type boolean
  // @default false
  //
  // Whether the notification is currently open.
  get opened() {
    return this.hasAttribute("opened");
  }
  set opened(opened) {
    opened === true ? this.setAttribute("opened", "") : this.removeAttribute("opened");
    this.#time = 0;
  }

  // @property
  // @attribute
  // @type number
  // @default 0
  //
  // Time (in miliseconds) after which this notification should disappear.<br/>
  // Set to 0 to disable the timeout.
  get timeout() {
    return this.hasAttribute("timeout") ? parseFloat(this.getAttribute("timeout")) : 0;
  }
  set timeout(timeout) {
    this.setAttribute("timeout", timeout);
  }

  // @property
  // @attribute
  // @type "small" || "medium" || "large" || "smaller" || "larger" || null
  // @default null
  get size() {
    return this.hasAttribute("size") ? this.getAttribute("size") : null;
  }
  set size(size) {
    (size === null) ? this.removeAttribute("size") : this.setAttribute("size", size);
  }

  // @property readOnly
  // @attribute
  // @type "small" || "medium" || "large"
  // @default "medium"
  // @readOnly
  get computedSize() {
    return this.hasAttribute("computedsize") ? this.getAttribute("computedsize") : "medium";
  }

  #shadowRoot = null;
  #time = 0;
  #intervalID = null;
  #xelSizeChangeListener = null;
  #windowPointerDownListener = null;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({mode: "open"});
    this.#shadowRoot.adoptedStyleSheets = [XNotificationElement.#shadowStyleSheet];
    this.#shadowRoot.append(document.importNode(XNotificationElement.#shadowTemplate.content, true));
  }

  connectedCallback() {
    this.setAttribute("tabindex", "0");
    this.#updateComputedSizeAttriubte();

    Xel.addEventListener("sizechange", this.#xelSizeChangeListener = () => this.#updateComputedSizeAttriubte());
  }

  disconnectedCallback() {
    Xel.removeEventListener("sizechange", this.#xelSizeChangeListener);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    else if (name === "opened") {
      this.opened ? this.#onOpen() : this.#onClose();
    }
    else if (name === "size") {
      this.#updateComputedSizeAttriubte();
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  #updateComputedSizeAttriubte() {
    let defaultSize = Xel.size;
    let customSize = this.size;
    let computedSize = "medium";

    if (customSize === null) {
      computedSize = defaultSize;
    }
    else if (customSize === "smaller") {
      computedSize = (defaultSize === "large") ? "medium" : "small";
    }
    else if (customSize === "larger") {
      computedSize = (defaultSize === "small") ? "medium" : "large";
    }
    else {
      computedSize = customSize;
    }

    if (computedSize === "medium") {
      this.removeAttribute("computedsize");
    }
    else {
      this.setAttribute("computedsize", computedSize);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  #onOpen() {
    // Animate in
    if (this.isConnected) {
      let fromBottom = (0 - this.getBoundingClientRect().height - 10) + "px";
      let toBottom = getComputedStyle(this).bottom;

      let inAnimation = this.animate(
        { bottom: [fromBottom, toBottom]},
        { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
    }

    // Automatically close the notification after given timeout
    {
      this.#time = 0;

      this.#intervalID = setInterval(() => {
        this.#time += 100;

        if (this.timeout > 0 && this.#time > this.timeout) {
          this.opened = false;
        }
      }, 100);

      let openTimeStamp = getTimeStamp();

      window.addEventListener("pointerdown", this.#windowPointerDownListener = (event) => {
        let pointerDownTimeStamp = getTimeStamp();
        let bounds = this.getBoundingClientRect();

        if (
          pointerDownTimeStamp - openTimeStamp > 10 &&
          rectContainsPoint(bounds, new DOMPoint(event.clientX, event.clientY)) === false
        ) {
          this.opened = false;
        }
      }, true);
    }
  }

  async #onClose() {
    clearInterval(this.#intervalID);

    // Animate out
    if (this.isConnected) {
      this.setAttribute("animating", "");
      let fromBottom = getComputedStyle(this).bottom;
      let toBottom = (0 - this.getBoundingClientRect().height - 10) + "px";

      let inAnimation = this.animate(
        { bottom: [fromBottom, toBottom]},
        { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );

      await inAnimation.finished;
      this.removeAttribute("animating");
    }

    window.removeEventListener("pointerdown", this.#windowPointerDownListener, true);
  }
}

customElements.define("x-notification", XNotificationElement);
