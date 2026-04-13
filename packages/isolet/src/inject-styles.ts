import { detectCspNonce } from "./detect-csp-nonce.js";

export const injectStyles = (
  id: string,
  css: string,
  target: HTMLElement | ShadowRoot,
): HTMLStyleElement | null => {
  if (typeof document === "undefined") return null;

  const styleId = `isolet-style-${id}`;
  const escapedId =
    typeof CSS !== "undefined" && CSS.escape
      ? CSS.escape(styleId)
      : styleId;

  const existing = ("getElementById" in target
    ? (target as unknown as Document).getElementById(styleId)
    : target.querySelector(`#${escapedId}`)) as HTMLStyleElement | null;
  if (existing) {
    existing.textContent = css;
    return existing;
  }

  const style = document.createElement("style");
  style.id = styleId;
  const nonce = detectCspNonce();
  if (nonce) style.setAttribute("nonce", nonce);
  style.textContent = css;
  target.appendChild(style);
  return style;
};
