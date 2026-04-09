export type MountFn<P = unknown> = (
  container: HTMLElement,
  props: P,
) => (() => void) | void;

/**
 * Vanilla DOM adapter for isolet. Identity function that provides
 * type safety for the mount signature.
 */
export const vanilla = <P = unknown>(render: MountFn<P>): MountFn<P> => render;
