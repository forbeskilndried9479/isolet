export const detectCspNonce = (): string | undefined => {
  if (typeof document === "undefined") return undefined;

  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="csp-nonce"]',
  );
  if (meta?.content) return meta.content;

  const script = document.querySelector<HTMLScriptElement>("script[nonce]");
  const nonce = script?.nonce || script?.getAttribute("nonce");
  if (nonce) return nonce;

  return undefined;
};
