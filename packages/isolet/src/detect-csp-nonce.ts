export const detectCspNonce = (): string | undefined => {
  if (typeof document === "undefined") return undefined;

  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="csp-nonce"]',
  );
  if (meta?.content) return meta.content;

  const script = document.querySelector<HTMLScriptElement>("script[nonce]");
  if (script?.nonce) return script.nonce;

  return undefined;
};
