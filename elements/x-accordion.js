
// @copyright
//   © 2016-2022 Jarosław Foksa
// @license
//   MIT License (check LICENSE.md for details)

import Xel from "../classes/xel.js";

import {html, css} from "../utils/template.js";

// @element x-accordion
// @part arrow - Arrow icon indicating whether the accordion is expanded or collapsed.
// @event expand - User expanded the accordion by clicking the arrow icon.
// @event collapse - User collapsed the accordion by clicking the arrow icon.
export default class XAccordionElement extends HTMLElement {
  static observedAttributes = ["expanded", "size"];

  static #shadowTemplate = html`
    <template>
      <main id="main">
        <div id="arrow-container">
          <svg id="arrow" part="arrow" viewBox="0 0 100 100" preserveAspectRatio="none" tabindex="1">
            <path></path>
          </svg>
        </div>

        <slot></slot>
      </main>
    </template>
  `;

  static #shadowStyleSheet = css`
    :host {
      display: block;
      width: 100%;
      margin: 8px 0;
      box-sizing: border-box;
    }
    :host([animating]) {
      overflow: hidden;
    }

    #main {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /**
     * Arrow
     */

    #arrow-container {
      position: absolute;
      top: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      pointer-events: none;
    }

    #arrow {
      display: flex;
      width: 16px;
      height: 16px;
      d: path("M 26 20 L 26 80 L 74 50 Z");
      transform: rotate(0deg);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      color: currentColor;
    }
    #arrow:focus {
      background: transparent;
      outline: none;
    }
    :host([expanded]) #arrow{
      transform: rotate(90deg);
    }

    #arrow path {
      fill: currentColor;
      d: inherit;
    }
  `
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @property
  // @attribute
  // @type boolean
  // @default false
  //
  // Whether the accordion is expanded.
  get expanded() {
    return this.hasAttribute("expanded");
  }
  set expanded(expanded) {
    expanded ? this.setAttribute("expanded", "") : this.removeAttribute("expanded");
  }

  // @property
  // @attribute
  // @type "small" || "medium" || "large" || "smaller" || "larger" || null
  // @default null
  //
  // Custom widget size.
  get size() {
    return this.hasAttribute("size") ? this.getAttribute("size") : null;
  }
  set size(size) {
    (size === null) ? this.removeAttribute("size") : this.setAttribute("size", size);
  }

  // @property
  // @attribute
  // @type "small" || "medium" || "large"
  // @default "medium"
  // @readOnly
  //
  // Resolved widget size, used for theming purposes.
  get computedSize() {
    return this.hasAttribute("computedsize") ? this.getAttribute("computedsize") : "medium";
  }

  #elements = {};
  #shadowRoot = null;
  #resizeObserver = null;
  #xelSizeChangeListener = null;
  #currentAnimation = null;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({mode: "open"});
    this.#shadowRoot.adoptedStyleSheets = [XAccordionElement.#shadowStyleSheet];
    this.#shadowRoot.append(document.importNode(XAccordionElement.#shadowTemplate.content, true));

    for (let element of this.#shadowRoot.querySelectorAll("[id]")) {
      this.#elements[element.id] = element;
    }

    this.#resizeObserver = new ResizeObserver(() => this.#updateArrowPosition());

    this.addEventListener("click", (event) => this.#onClick(event));
    this.#elements["arrow"].addEventListener("keydown", (event) => this.#onArrowKeyDown(event));
  }

  connectedCallback() {
    this.#updateComputedSizeAttriubte();

    Xel.addEventListener("sizechange", this.#xelSizeChangeListener = () => this.#updateComputedSizeAttriubte());
    this.#resizeObserver.observe(this);
  }

  disconnectedCallback() {
    Xel.removeEventListener("sizechange", this.#xelSizeChangeListener);
    this.#resizeObserver.unobserve(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    else if (name === "expanded") {
      this.#updateArrowPosition();
    }
    else if (name === "size") {
      this.#updateComputedSizeAttriubte();
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @method
  // @type () => Promise
  //
  // Expand the accordion. Returns a promise which will be resolved when the accordion finishes animating.
  expand() {
    return new Promise(async (resolve) => {
      if (this.expanded === false) {
        let startBBox = this.getBoundingClientRect();

        if (this.#currentAnimation) {
          this.#currentAnimation.finish();
        }

        this.expanded = true;
        this.removeAttribute("animating");
        let endBBox = this.getBoundingClientRect();
        this.setAttribute("animating", "");

        let animation = this.animate(
          {
            height: [startBBox.height + "px", endBBox.height + "px"],
          },
          {
            duration: 300,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)"
          }
        );

        this.#currentAnimation = animation;
        await animation.finished;

        if (this.#currentAnimation === animation) {
          this.removeAttribute("animating");
        }
      }

      resolve();
    });
  }

  // @method
  // @type () => Promise
  //
  // Collapse the accordion. Returns a promise which will be resolved when the accordion finishes animating.
  collapse() {
    return new Promise(async (resolve) => {
      if (this.expanded === true) {
        let startBBox = this.getBoundingClientRect();

        if (this.#currentAnimation) {
          this.#currentAnimation.finish();
        }

        this.expanded = false;
        this.removeAttribute("animating");
        let endBBox = this.getBoundingClientRect();
        this.setAttribute("animating", "");

        let animation = this.animate(
          {
            height: [startBBox.height + "px", endBBox.height + "px"],
          },
          {
            duration: 300,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)"
          }
        );

        this.#currentAnimation = animation;
        await animation.finished;

        if (this.#currentAnimation === animation) {
          this.removeAttribute("animating");
        }
      }

      resolve();
    });
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  #updateArrowPosition() {
    let header = this.querySelector(":scope > header");

    if (header) {
      this.#elements["arrow-container"].style.height = header.getBoundingClientRect().height + "px";
    }
    else {
      this.#elements["arrow-container"].style.height = null;
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  #onArrowKeyDown(event) {
    if (event.key === "Enter") {
      this.querySelector("header").click();
    }
  }

  #onClick(event) {
    let header = this.querySelector("header");
    let closestFocusableElement = event.target.closest("[tabindex]");

    if (header.contains(event.target) && this.contains(closestFocusableElement) === false) {
      if (this.expanded) {
        this.collapse();
        this.dispatchEvent(new CustomEvent("collapse"));
      }
      else {
        this.expand();
        this.dispatchEvent(new CustomEvent("expand"));
      }
    }
  }
}

customElements.define("x-accordion", XAccordionElement);
