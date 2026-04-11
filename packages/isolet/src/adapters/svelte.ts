import { mount, unmount, type Component } from "svelte";

/**
 * Svelte 5 adapter for isolet. Mounts a Svelte component into the
 * container and recreates it on subsequent calls with new props.
 */
export const svelte = <P extends Record<string, unknown>>(
  SvelteComponent: Component<P>,
): ((container: HTMLElement, props: P) => () => void) => {
  let instance: Record<string, unknown> | null = null;

  return (container: HTMLElement, props: P) => {
    if (instance) {
      unmount(instance);
    }

    instance = mount(SvelteComponent, { target: container, props });

    return () => {
      if (instance) {
        unmount(instance);
        instance = null;
      }
    };
  };
};
