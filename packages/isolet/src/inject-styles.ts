import { detectCspNonce } from "./detect-csp-nonce.js";

export const injectStyles = (
  id: string,
  css: string,
  target: HTMLElement | ShadowRoot,
): HTMLStyleElement => {
  const styleId = `isolet-style-${id}`;

  const existing = ("getElementById" in target
    ? (target as unknown as Document).getElementById(styleId)
    : target.querySelector(`#${CSS.escape(styleId)}`)) as HTMLStyleElement | null;
  if (existing) {
    existing.textContent = css;
    return existing;
  }

  const style = document.createElement("style");
  style.id = styleId;
  const nonce = detectCspNonce();
  if (nonce) style.nonce = nonce;
  style.textContent = css;
  target.appendChild(style);
  return style;
};
