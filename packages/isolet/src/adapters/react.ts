import { createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * React adapter for isolet. Creates a React root once and re-renders
 * on subsequent calls with new props (no teardown between updates).
 */
export const react = <P extends Record<string, unknown>>(
  Component: ComponentType<P>,
): ((container: HTMLElement, props: P) => () => void) => {
  let root: Root | null = null;

  return (container: HTMLElement, props: P) => {
    if (!root) root = createRoot(container);
    root.render(createElement(Component, props));

    return () => {
      root?.unmount();
      root = null;
    };
  };
};
