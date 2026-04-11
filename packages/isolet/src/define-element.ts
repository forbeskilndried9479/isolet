import { injectStyles } from "./inject-styles.js";
import type { IsoletOptions } from "./types.js";

export interface DefineElementOptions<P = unknown>
  extends Omit<IsoletOptions<P>, "name" | "isolation"> {
  /**
   * HTML attributes to observe. Changes to these trigger prop updates.
   * Each attribute name maps to a key on the props object.
   */
  observedAttributes?: string[];

  /**
   * Transform raw attribute strings into typed props.
   * Called with the current attribute map on every attribute change.
   * Defaults to passing attributes through as-is.
   */
  transformProps?: (attrs: Record<string, string | null>) => P;
}

/**
 * Register an isolet as a custom element (web component).
 *
 * ```ts
 * defineElement("my-counter", {
 *   mount: react(Counter),
 *   css: styles,
 *   observedAttributes: ["count", "label"],
 * });
 * ```
 *
 * Then use in HTML: `<my-counter count="5" label="Items"></my-counter>`
 */
export const defineElement = <P extends Record<string, unknown>>(
  tagName: string,
  options: DefineElementOptions<P>,
): CustomElementConstructor => {
  const observed = options.observedAttributes ?? [];

  const getProps = (el: HTMLElement): P => {
    const attrs: Record<string, string | null> = {};
    for (const name of observed) {
      attrs[name] = el.getAttribute(name);
    }
    if (options.transformProps) {
      return options.transformProps(attrs);
    }
    return attrs as unknown as P;
  };

  if (customElements.get(tagName)) {
    return customElements.get(tagName)!;
  }

  class IsoletElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return observed;
    }

    #cleanup: (() => void) | undefined;
    #container: HTMLElement;
    #connected = false;

    constructor() {
      super();

      const shadow = this.attachShadow({
        mode: options.shadowMode ?? "open",
      });

      if (options.css) {
        injectStyles(tagName, options.css, shadow);
      }

      this.#container = document.createElement("div");
      shadow.appendChild(this.#container);
    }

    connectedCallback(): void {
      this.#connected = true;
      this.#render();
    }

    disconnectedCallback(): void {
      this.#connected = false;
      this.#teardown();
      this.#container.innerHTML = "";
    }

    attributeChangedCallback(): void {
      if (!this.#connected) return;
      this.#render();
    }

    #teardown(): void {
      if (this.#cleanup) this.#cleanup();
      this.#cleanup = undefined;
    }

    #render(): void {
      this.#teardown();
      const result = options.mount(this.#container, getProps(this));
      if (typeof result === "function") this.#cleanup = result;
    }
  }

  customElements.define(tagName, IsoletElement);
  return IsoletElement;
};
