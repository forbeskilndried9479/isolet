import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/**
 * Solid adapter for isolet. Disposes and re-renders on each call
 * since Solid's fine-grained reactivity requires proper signal wiring
 * that can't be bridged generically from the outside.
 */
export const solid = <P extends Record<string, unknown>>(
  Component: (props: P) => JSX.Element,
): ((container: HTMLElement, props: P) => () => void) => {
  let dispose: (() => void) | undefined;

  return (container: HTMLElement, props: P) => {
    if (dispose) {
      dispose();
      dispose = undefined;
    }

    dispose = render(() => Component(props), container);

    return () => {
      dispose?.();
      dispose = undefined;
    };
  };
};
