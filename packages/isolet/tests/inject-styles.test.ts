import { describe, it, expect, beforeEach } from "vitest";
import { injectStyles } from "../src/inject-styles.js";

describe("injectStyles", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("injects a style element into an HTML element", () => {
    const container = document.createElement("div");
    const style = injectStyles("test", "body { margin: 0; }", container);

    expect(style).toBeInstanceOf(HTMLStyleElement);
    expect(style.textContent).toBe("body { margin: 0; }");
    expect(style.id).toBe("isolet-style-test");
    expect(container.contains(style)).toBe(true);
  });

  it("updates existing style if same id is injected again", () => {
    const container = document.createElement("div");
    const style1 = injectStyles("dup", "a { color: red; }", container);
    const style2 = injectStyles("dup", "a { color: blue; }", container);

    expect(style1).toBe(style2);
    expect(style2.textContent).toBe("a { color: blue; }");
    expect(container.querySelectorAll("style").length).toBe(1);
  });

  it("injects into a shadow root", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const style = injectStyles("shadow", "p { color: green; }", shadow);

    expect(shadow.contains(style)).toBe(true);
    expect(style.textContent).toBe("p { color: green; }");
  });
});
