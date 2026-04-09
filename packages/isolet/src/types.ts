/**
 * How to isolate the widget's styles from the host page.
 *
 * - "shadow-dom": Full isolation via shadow DOM (default)
 * - "scoped": Renders into a plain div (no shadow DOM, styles apply globally)
 * - "none": No wrapper at all -mounts directly into the target
 */
export type IsolationMode = "shadow-dom" | "scoped" | "none";

export interface IsoletOptions<P = unknown> {
  /**
   * Unique name for this isolet (used as data attribute for identification).
   */
  name: string;

  /**
   * Render the component into the container element.
   * This is where you use your framework of choice (React, Solid, Svelte, vanilla, etc).
   *
   * Return an optional cleanup function, or nothing.
   */
  mount: (container: HTMLElement, props: P) => (() => void) | void;

  /**
   * CSS text to inject into the container.
   * In shadow-dom mode, this is scoped to the shadow root.
   * In scoped/none mode, this is appended as a <style> tag.
   */
  css?: string;

  /**
   * Isolation strategy. Defaults to "shadow-dom".
   */
  isolation?: IsolationMode;

  /**
   * Shadow DOM mode. Only applies when isolation is "shadow-dom".
   * Defaults to "open".
   */
  shadowMode?: ShadowRootMode;

  /**
   * Custom attributes to set on the host element.
   * Does not apply when isolation is "none".
   */
  hostAttributes?: Record<string, string>;

  /**
   * z-index for the host element.
   * Does not apply when isolation is "none".
   */
  zIndex?: string | number;
}

export interface IsoletInstance<P = unknown> {
  /**
   * Mount the isolet into a target element (defaults to document.body).
   */
  mount: (target?: HTMLElement, props?: P) => void;

  /**
   * Update props on the mounted component.
   * Calls the mount function again with merged props.
   */
  update: (props: Partial<P>) => void;

  /**
   * Unmount and clean up the isolet.
   */
  unmount: () => void;

  /**
   * The container element the component renders into (available after mount).
   */
  readonly container: HTMLElement | null;

  /**
   * The shadow root, if isolation is "shadow-dom" (available after mount).
   */
  readonly shadowRoot: ShadowRoot | null;

  /**
   * Whether the isolet is currently mounted.
   */
  readonly mounted: boolean;
}
