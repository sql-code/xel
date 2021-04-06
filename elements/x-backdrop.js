
// @copyright
//   © 2016-2021 Jarosław Foksa
// @license
//   GNU General Public License v3, Xel Commercial License v1 (check LICENSE.md for details)

import {css} from "../utils/template.js";

// @element x-backdrop
export default class XBackdropElement extends HTMLElement {
  static _shadowStyleSheet = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
      touch-action: none;
      will-change: opacity;
      cursor: default;
      background: rgba(0, 0, 0, 0.5);
    }
    :host([hidden]) {
      display: none;
    }
  `
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @property
  // @type HTMLElement
  //
  // Element below which the backdrop should be placed.
  get ownerElement() {
    return this._ownerElement ? this._ownerElement : document.body.firstElementChild;
  }
  set ownerElement(ownerElement) {
    this._ownerElement = ownerElement;
  }

  _shadowRoot = null;
  _ownerElement = null;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  constructor() {
    super();

    this._shadowRoot = this.attachShadow({mode: "closed"});
    this._shadowRoot.adoptedStyleSheets = [XBackdropElement._shadowStyleSheet];

    this.addEventListener("pointerdown", (event) => event.preventDefault()); // Don't steal the focus
  }

  connectedCallback() {
    this.addEventListener("wheel", this._wheelListener = (event) => event.preventDefault());
  }

  disconnectedCallback() {
    this.removeEventListener("wheel", this._wheelListener);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // @method
  // @type (boolean) => Promise
  show(animate = true) {
    this.title = "";
    this.style.top = "0px";
    this.style.left = "0px";
    this.ownerElement.before(this);
    this.hidden = false;

    let bounds = this.getBoundingClientRect();
    let extraTop = 0;
    let extraLeft = 0;

    // Determine extraLeft and extraTop which represent the extra offset needed when the backdrop is inside another
    // fixed-positioned element such as a popover
    {
      if (bounds.top !== 0 || bounds.left !== 0) {
        extraTop = -bounds.top;
        extraLeft = -bounds.left;
      }
    }

    // Ensure the backdrop is stacked directly below the ref element
    {
      let zIndex = parseFloat(getComputedStyle(this.ownerElement).zIndex);
      this.style.zIndex = zIndex - 1;
    }

    this.style.top = (extraTop) + "px";
    this.style.left = (extraLeft) + "px";

    // Animate the backdrop
    if (animate) {
      let backdropAnimation = this.animate(
        {
          opacity: ["0", "1"]
        },
        {
          duration: 100,
          easing: "ease-out"
        }
      );

      return backdropAnimation.finished;
    }
  }

  // @method
  // @type (boolean) => Promise
  hide(animate = true) {
    if (animate) {
      let backdropAnimation = this.animate(
        {
          opacity: ["1", "0"]
        },
        {
          duration: 100,
          easing: "ease-in"
        }
      );

      backdropAnimation.finished.then(() => {
        this.remove();
      });

      return backdropAnimation.finished;
    }
    else {
      this.remove();
    }
  }
}

customElements.define("x-backdrop", XBackdropElement);
