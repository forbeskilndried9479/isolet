import { describe, it, expect, vi } from "vitest";
import { defineElement } from "../src/define-element.js";

describe("defineElement", () => {
  it("registers a custom element", () => {
    defineElement("test-widget-register", {
      mount: () => {},
    });

    expect(customElements.get("test-widget-register")).toBeDefined();
  });

  it("calls mount on connectedCallback", async () => {
    const mount = vi.fn();
    defineElement("test-widget-mount", { mount });

    const el = document.createElement("test-widget-mount");
    document.body.appendChild(el);

    expect(mount).toHaveBeenCalledOnce();
    expect(mount).toHaveBeenCalledWith(expect.any(HTMLElement), {});

    el.remove();
  });

  it("calls cleanup on disconnectedCallback", () => {
    const cleanup = vi.fn();
    defineElement("test-widget-cleanup", {
      mount: () => cleanup,
    });

    const el = document.createElement("test-widget-cleanup");
    document.body.appendChild(el);
    expect(cleanup).not.toHaveBeenCalled();

    el.remove();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("injects CSS into shadow root", () => {
    const css = "p { color: blue; }";
    defineElement("test-widget-css", {
      mount: () => {},
      css,
    });

    const el = document.createElement("test-widget-css");
    document.body.appendChild(el);

    const style = el.shadowRoot?.querySelector("style");
    expect(style?.textContent).toBe(css);

    el.remove();
  });

  it("passes observed attributes as props", () => {
    const mount = vi.fn();
    defineElement("test-widget-attrs", {
      mount,
      observedAttributes: ["count", "label"],
    });

    const el = document.createElement("test-widget-attrs");
    el.setAttribute("count", "5");
    el.setAttribute("label", "Items");
    document.body.appendChild(el);

    expect(mount).toHaveBeenCalledWith(expect.any(HTMLElement), {
      count: "5",
      label: "Items",
    });

    el.remove();
  });

  it("re-renders on attribute change", () => {
    const mount = vi.fn();
    defineElement("test-widget-update", {
      mount,
      observedAttributes: ["value"],
    });

    const el = document.createElement("test-widget-update");
    el.setAttribute("value", "a");
    document.body.appendChild(el);

    expect(mount).toHaveBeenCalledTimes(1);

    el.setAttribute("value", "b");
    expect(mount).toHaveBeenCalledTimes(2);
    expect(mount).toHaveBeenLastCalledWith(expect.any(HTMLElement), {
      value: "b",
    });

    el.remove();
  });

  it("calls cleanup before re-render on attribute change", () => {
    const cleanup = vi.fn();
    const mount = vi.fn(() => cleanup);
    defineElement("test-widget-attr-cleanup", {
      mount,
      observedAttributes: ["value"],
    });

    const el = document.createElement("test-widget-attr-cleanup");
    el.setAttribute("value", "a");
    document.body.appendChild(el);

    expect(cleanup).not.toHaveBeenCalled();

    el.setAttribute("value", "b");
    expect(cleanup).toHaveBeenCalledOnce();
    expect(mount).toHaveBeenCalledTimes(2);

    el.remove();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it("does not throw on duplicate registration", () => {
    defineElement("test-widget-dup", { mount: () => {} });
    expect(() => {
      defineElement("test-widget-dup", { mount: () => {} });
    }).not.toThrow();
  });

  it("supports transformProps for typed props", () => {
    const mount = vi.fn();
    defineElement("test-widget-transform", {
      mount,
      observedAttributes: ["count"],
      transformProps: (attrs) => ({
        count: Number(attrs.count ?? 0),
      }),
    });

    const el = document.createElement("test-widget-transform");
    el.setAttribute("count", "42");
    document.body.appendChild(el);

    expect(mount).toHaveBeenCalledWith(expect.any(HTMLElement), {
      count: 42,
    });

    el.remove();
  });
});
