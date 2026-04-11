import { mountContainer, type MountResult } from "./mount-container.js";
import type { IsoletInstance, IsoletOptions } from "./types.js";

export const createIsolet = <P = unknown>(
  options: IsoletOptions<P>,
): IsoletInstance<P> => {
  let result: MountResult | null = null;
  let cleanup: (() => void) | void;
  let currentProps: P | undefined;
  let isMounted = false;

  const render = (props: P): void => {
    if (!result) return;
    cleanup = options.mount(result.container, props);
  };

  const instance: IsoletInstance<P> = {
    mount(target?: HTMLElement, props?: P) {
      if (isMounted) return;

      const mountTarget = target ?? document.body;
      result = mountContainer(options.name, mountTarget, {
        isolation: options.isolation,
        css: options.css,
        shadowMode: options.shadowMode,
        hostAttributes: options.hostAttributes,
        hostStyles: options.hostStyles,
        zIndex: options.zIndex,
      });

      currentProps = props ?? ({} as P);
      isMounted = true;
      render(currentProps);
    },

    update(props: Partial<P>) {
      if (!isMounted || !result) return;
      currentProps = { ...(currentProps ?? ({} as P)), ...props } as P;
      render(currentProps);
    },

    unmount() {
      if (!isMounted) return;
      if (cleanup) cleanup();
      cleanup = undefined;

      if (result?.host) {
        result.host.remove();
      }

      const injectedStyle = (result?.container ?? document).querySelector(
        `#isolet-style-${CSS.escape(options.name)}`,
      );
      if (injectedStyle) injectedStyle.remove();

      result = null;
      currentProps = undefined;
      isMounted = false;
    },

    get host() {
      return result?.host ?? null;
    },

    get container() {
      return result?.container ?? null;
    },

    get shadowRoot() {
      return result?.shadowRoot ?? null;
    },

    get mounted() {
      return isMounted;
    },
  };

  return instance;
};
