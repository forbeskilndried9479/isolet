import { describe, it, expect, beforeEach } from "vitest";
import { detectCspNonce } from "../src/detect-csp-nonce.js";

describe("detectCspNonce", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("returns undefined when no nonce source exists", () => {
    expect(detectCspNonce()).toBeUndefined();
  });

  it("reads nonce from meta[name='csp-nonce']", () => {
    const meta = document.createElement("meta");
    meta.name = "csp-nonce";
    meta.content = "abc123";
    document.head.appendChild(meta);

    expect(detectCspNonce()).toBe("abc123");
  });

  it("reads nonce from first script[nonce]", () => {
    const script = document.createElement("script");
    script.setAttribute("nonce", "xyz789");
    document.head.appendChild(script);

    expect(detectCspNonce()).toBe("xyz789");
  });

  it("prefers meta over script nonce", () => {
    const meta = document.createElement("meta");
    meta.name = "csp-nonce";
    meta.content = "from-meta";
    document.head.appendChild(meta);

    const script = document.createElement("script");
    script.setAttribute("nonce", "from-script");
    document.head.appendChild(script);

    expect(detectCspNonce()).toBe("from-meta");
  });

  it("skips meta with empty content", () => {
    const meta = document.createElement("meta");
    meta.name = "csp-nonce";
    meta.content = "";
    document.head.appendChild(meta);

    expect(detectCspNonce()).toBeUndefined();
  });
});
