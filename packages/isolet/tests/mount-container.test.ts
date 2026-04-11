import { describe, it, expect, beforeEach } from "vitest";
import { mountContainer } from "../src/mount-container.js";

describe("mountContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("defaults to shadow-dom isolation", () => {
    const target = document.createElement("div");
    const result = mountContainer("test", target);

    expect(result.host).toBeInstanceOf(HTMLElement);
    expect(result.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(result.container).toBeInstanceOf(HTMLElement);
    expect(result.target).toBe(target);
  });

  it("reuses existing shadow-dom host", () => {
    const target = document.createElement("div");
    const first = mountContainer("reuse-shadow", target);
    const second = mountContainer("reuse-shadow", target);

    expect(second.host).toBe(first.host);
    expect(second.shadowRoot).toBe(first.shadowRoot);
    expect(second.container).toBe(first.container);
  });

  it("reuses existing scoped host", () => {
    const target = document.createElement("div");
    const first = mountContainer("reuse-scoped", target, {
      isolation: "scoped",
    });
    const second = mountContainer("reuse-scoped", target, {
      isolation: "scoped",
    });

    expect(second.host).toBe(first.host);
    expect(second.container).toBe(first.container);
  });

  it("none mode returns target as container", () => {
    const target = document.createElement("div");
    const result = mountContainer("none", target, { isolation: "none" });

    expect(result.host).toBeNull();
    expect(result.shadowRoot).toBeNull();
    expect(result.container).toBe(target);
    expect(result.target).toBe(target);
  });

  it("injects CSS into shadow root", () => {
    const target = document.createElement("div");
    const result = mountContainer("css-shadow", target, {
      css: "p { color: red; }",
    });

    const style = result.shadowRoot?.querySelector("style");
    expect(style?.textContent).toBe("p { color: red; }");
  });

  it("injects CSS onto target in scoped mode", () => {
    const target = document.createElement("div");
    mountContainer("css-scoped", target, {
      isolation: "scoped",
      css: "p { color: blue; }",
    });

    const style = target.querySelector("#isolet-style-css-scoped");
    expect(style?.textContent).toBe("p { color: blue; }");
  });

  it("injects CSS onto target in none mode", () => {
    const target = document.createElement("div");
    mountContainer("css-none", target, {
      isolation: "none",
      css: "p { color: green; }",
    });

    const style = target.querySelector("#isolet-style-css-none");
    expect(style?.textContent).toBe("p { color: green; }");
  });

  it("applies hostAttributes", () => {
    const target = document.createElement("div");
    const result = mountContainer("attrs", target, {
      hostAttributes: { role: "dialog", "data-x": "1" },
    });

    expect(result.host?.getAttribute("role")).toBe("dialog");
    expect(result.host?.getAttribute("data-x")).toBe("1");
  });

  it("applies hostStyles with string values", () => {
    const target = document.createElement("div");
    const result = mountContainer("str-styles", target, {
      hostStyles: { position: "fixed", pointerEvents: "none" },
    });

    expect(result.host?.style.position).toBe("fixed");
    expect(result.host?.style.pointerEvents).toBe("none");
  });

  it("applies zIndex after all:initial in shadow mode", () => {
    const target = document.createElement("div");
    const result = mountContainer("zindex", target, {
      zIndex: "999",
    });

    expect(result.host?.style.zIndex).toBe("999");
  });

  it("sets all:initial on shadow-dom host", () => {
    const target = document.createElement("div");
    const result = mountContainer("reset", target);

    expect(result.host?.style.getPropertyValue("all")).toBe("initial");
  });

  it("does not set all:initial on scoped host", () => {
    const target = document.createElement("div");
    const result = mountContainer("no-reset", target, {
      isolation: "scoped",
    });

    expect(result.host?.style.getPropertyValue("all")).toBe("");
  });
});
