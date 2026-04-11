import { createApp, type Component, type App } from "vue";

/**
 * Vue adapter for isolet. Creates a Vue app instance once and
 * recreates it on subsequent calls with new props.
 */
export const vue = <P extends Record<string, unknown>>(
  RootComponent: Component,
): ((container: HTMLElement, props: P) => () => void) => {
  let app: App | null = null;

  return (container: HTMLElement, props: P) => {
    if (app) {
      app.unmount();
    }

    app = createApp(RootComponent, props);
    app.mount(container);

    return () => {
      app?.unmount();
      app = null;
    };
  };
};
