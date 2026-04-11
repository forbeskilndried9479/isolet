import { createElement, render, type ComponentType } from "preact";

/**
 * Preact adapter for isolet. Renders a Preact component into the container
 * and re-renders on subsequent calls with new props (no teardown between updates).
 */
export const preact = <P extends Record<string, unknown>>(
  Component: ComponentType<P>,
): ((container: HTMLElement, props: P) => () => void) => {
  return (container: HTMLElement, props: P) => {
    render(createElement(Component, props), container);

    return () => {
      render(null, container);
    };
  };
};
