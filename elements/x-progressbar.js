
// @copyright
//   © 2016-2022 Jarosław Foksa
// @license
//   MIT License (check LICENSE.md for details)

import Xel from "../classes/xel.js";

import {html, css} from "../utils/template.js";

// @element x-progressbar
// @part bar
export default class XProgressbarElement extends HTMLElement {
  static observedAttributes = ["value", "max", "disabled", "size"];

  static #shadowTemplate = html`
    <template>
      <div id="determinate-bar" part="bar"></div>

      <div id="indeterminate-bars">
        <div id="primary-indeterminate-bar" part="bar"></div>
        <div id="secondary-indeterminate-bar" part="bar"></div>
      </div>
    </template>
  `;

  static #shadowStyleSheet = css`
    :host {
      display: block;
      box-sizing: border-box;
      height: 8px;
      width: 100%;
      position: relative;
      contain: strict;
      overflow: hidden;
      background: #acece6;
      cursor: default;
    }
    :host([hidden]) {
      display: none;
    }

    #indeterminate-bars {
      width: 100%;
      height: 100%;
    }

    #determinate-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 0%;
      height: 100%;
      background: #3B99FB;
      box-shadow: 0px 0px 0px 1px #3385DB;
      transition: width 0.4s ease-in-out;
      will-change: left, right;
    }
    :host([value="-1"]) #determinate-bar {
      visibility: hidden;
    }

    #primary-indeterminate-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      height: 100%;
      background: #3B99FB;
      will-change: left, right;
    }

    #secondary-indeterminate-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      height: 100%;
      background: #3B99FB;
      will-change: left, right;
    }
  `

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @property
  // @attribute
  // @type number?
  // @default null
  //
  // Current progress, in procentages.
  get value() {
    return this.hasAttribute("value") ? parseFloat(this.getAttribute("value")) : null;
  }
  set value(value) {
    value === null ? this.removeAttribute("value") : this.setAttribute("value", value);
  }

  // @property
  // @attribute
  // @type number
  // @default 1
  get max() {
    return this.hasAttribute("max") ? parseFloat(this.getAttribute("max")) : 1;
  }
  set max(max) {
    this.setAttribute("max", max);
  }

  // @property
  // @attribute
  // @type boolean
  // @default false
  //
  // Whether this button is disabled.
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(disabled) {
    disabled ? this.setAttribute("disabled", "") : this.removeAttribute("disabled");
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
  #elements = {};
  #indeterminateAnimations = null;
  #xelSizeChangeListener = null;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({mode: "open"});
    this.#shadowRoot.adoptedStyleSheets = [XProgressbarElement.#shadowStyleSheet];
    this.#shadowRoot.append(document.importNode(XProgressbarElement.#shadowTemplate.content, true));

    for (let element of this.#shadowRoot.querySelectorAll("[id]")) {
      this.#elements[element.id] = element;
    }
  }

  connectedCallback() {
    Xel.addEventListener("sizechange", this.#xelSizeChangeListener = () => this.#updateComputedSizeAttriubte());

    this.#update();
    this.#updateComputedSizeAttriubte();
  }

  disconnectedCallback() {
    Xel.removeEventListener("sizechange", this.#xelSizeChangeListener);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    else if (name === "value") {
      this.#update();
    }
    else if (name === "disabled") {
      this.#update();
    }
    else if (name === "size") {
      this.#updateComputedSizeAttriubte();
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  #update() {
    // Determinate bar
    {
      // Hide
      if (this.value === null || this.value === -1 || this.disabled) {
        this.#elements["determinate-bar"].style.width = "0%";
      }
      // Show
      else {
        this.#elements["determinate-bar"].style.width = ((this.value / this.max) * 100) + "%";
      }
    }

    // Indeterminate bars
    {
      // Hide
      if (this.value !== null || this.disabled) {
        if (this.#indeterminateAnimations) {
          for (let animation of this.#indeterminateAnimations) {
            animation.cancel();
          }

          this.#indeterminateAnimations = null;
        }
      }
      // Show
      else {
        if (!this.#indeterminateAnimations) {
          this.#indeterminateAnimations = [
            this.#elements["primary-indeterminate-bar"].animate(
              [
                { left: "-35%", right: "100%", offset: 0.0 },
                { left: "100%", right: "-90%", offset: 0.6 },
                { left: "100%", right: "-90%", offset: 1.0 }
              ],
              {
                duration: 2000,
                easing: "ease-in-out",
                iterations: Infinity
              }
            ),
            this.#elements["secondary-indeterminate-bar"].animate(
              [
                { left: "-100%", right: "100%", offset: 0.0 },
                { left:  "110%", right: "-30%", offset: 0.8 },
                { left:  "110%", right: "-30%", offset: 1.0 }
              ],
              {
                duration: 2000,
                delay: 1000,
                easing: "ease-in-out",
                iterations: Infinity
              }
            )
          ];
        }
      }
    }
  }

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
}

customElements.define("x-progressbar", XProgressbarElement);
