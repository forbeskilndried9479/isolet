import { describe, it, expect, vi } from "vitest";
import { createIsolet } from "../src/create-isolet.js";

describe("createIsolet", () => {
  it("starts unmounted", () => {
    const widget = createIsolet({
      name: "test",
      mount: () => {},
    });
    expect(widget.mounted).toBe(false);
    expect(widget.container).toBeNull();
    expect(widget.shadowRoot).toBeNull();
  });

  it("mounts into shadow DOM by default", () => {
    const mount = vi.fn();
    const widget = createIsolet({ name: "shadow-test", mount });

    const target = document.createElement("div");
    widget.mount(target, { value: 1 });

    expect(widget.mounted).toBe(true);
    expect(widget.container).toBeInstanceOf(HTMLElement);
    expect(widget.shadowRoot).toBeInstanceOf(ShadowRoot);
    expect(mount).toHaveBeenCalledOnce();
    expect(mount).toHaveBeenCalledWith(widget.container, { value: 1 });

    widget.unmount();
  });

  it("injects CSS into shadow root", () => {
    const css = "h1 { color: red; }";
    const widget = createIsolet({
      name: "css-test",
      mount: () => {},
      css,
    });

    const target = document.createElement("div");
    widget.mount(target);

    const style = widget.shadowRoot?.querySelector("style");
    expect(style).toBeTruthy();
    expect(style?.textContent).toBe(css);

    widget.unmount();
  });

  it("mounts in scoped mode without shadow DOM", () => {
    const widget = createIsolet({
      name: "scoped-test",
      mount: () => {},
      isolation: "scoped",
    });

    const target = document.createElement("div");
    widget.mount(target);

    expect(widget.mounted).toBe(true);
    expect(widget.shadowRoot).toBeNull();
    expect(widget.container).toBeInstanceOf(HTMLElement);
    expect(target.querySelector("[data-isolet='scoped-test']")).toBeTruthy();

    widget.unmount();
  });

  it("mounts in none mode directly into target", () => {
    const mount = vi.fn();
    const widget = createIsolet({
      name: "none-test",
      mount,
      isolation: "none",
    });

    const target = document.createElement("div");
    widget.mount(target);

    expect(widget.mounted).toBe(true);
    expect(widget.shadowRoot).toBeNull();
    expect(widget.container).toBe(target);
    expect(mount).toHaveBeenCalledWith(target, {});

    widget.unmount();
  });

  it("calls mount again on update without cleanup", () => {
    const mount = vi.fn();
    const widget = createIsolet({ name: "update-test", mount });

    const target = document.createElement("div");
    widget.mount(target, { count: 0 });
    expect(mount).toHaveBeenCalledTimes(1);

    widget.update({ count: 1 });
    expect(mount).toHaveBeenCalledTimes(2);
    expect(mount).toHaveBeenLastCalledWith(widget.container, { count: 1 });

    widget.unmount();
  });

  it("calls cleanup on unmount", () => {
    const cleanup = vi.fn();
    const widget = createIsolet({
      name: "cleanup-test",
      mount: () => cleanup,
    });

    const target = document.createElement("div");
    widget.mount(target);
    expect(cleanup).not.toHaveBeenCalled();

    widget.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(widget.mounted).toBe(false);
  });

  it("ignores mount when already mounted", () => {
    const mount = vi.fn();
    const widget = createIsolet({ name: "double-mount", mount });

    const target = document.createElement("div");
    widget.mount(target);
    widget.mount(target);

    expect(mount).toHaveBeenCalledOnce();
    widget.unmount();
  });

  it("ignores update and unmount when not mounted", () => {
    const mount = vi.fn();
    const widget = createIsolet({ name: "not-mounted", mount });

    widget.update({ x: 1 });
    widget.unmount();

    expect(mount).not.toHaveBeenCalled();
  });

  it("removes host element on unmount", () => {
    const widget = createIsolet({
      name: "remove-test",
      mount: () => {},
    });

    const target = document.createElement("div");
    document.body.appendChild(target);
    widget.mount(target);

    expect(target.querySelector("[data-isolet='remove-test']")).toBeTruthy();

    widget.unmount();
    expect(target.querySelector("[data-isolet='remove-test']")).toBeNull();

    target.remove();
  });

  it("removes injected style on scoped unmount", () => {
    const css = ".x { color: red; }";
    const widget = createIsolet({
      name: "scoped-style-cleanup",
      mount: () => {},
      css,
      isolation: "scoped",
    });

    const target = document.createElement("div");
    document.body.appendChild(target);
    widget.mount(target);

    expect(target.querySelector("#isolet-style-scoped-style-cleanup")).toBeTruthy();

    widget.unmount();
    expect(target.querySelector("#isolet-style-scoped-style-cleanup")).toBeNull();

    target.remove();
  });

  it("removes injected style on none-mode unmount", () => {
    const css = ".y { color: blue; }";
    const widget = createIsolet({
      name: "none-style-cleanup",
      mount: () => {},
      css,
      isolation: "none",
    });

    const target = document.createElement("div");
    document.body.appendChild(target);
    widget.mount(target);

    expect(target.querySelector("#isolet-style-none-style-cleanup")).toBeTruthy();

    widget.unmount();
    expect(target.querySelector("#isolet-style-none-style-cleanup")).toBeNull();

    target.remove();
  });

  it("sets host attributes", () => {
    const widget = createIsolet({
      name: "attr-test",
      mount: () => {},
      hostAttributes: { "data-custom": "value", role: "dialog" },
    });

    const target = document.createElement("div");
    widget.mount(target);

    const host = target.querySelector("[data-isolet='attr-test']");
    expect(host?.getAttribute("data-custom")).toBe("value");
    expect(host?.getAttribute("role")).toBe("dialog");

    widget.unmount();
  });

  it("applies hostStyles after shadow DOM reset", () => {
    const widget = createIsolet({
      name: "styles-test",
      mount: () => {},
      hostStyles: {
        position: "fixed",
        top: "0",
        left: "0",
        pointerEvents: "none",
      },
      zIndex: "2147483647",
    });

    const target = document.createElement("div");
    widget.mount(target);

    const host = target.querySelector<HTMLElement>(
      "[data-isolet='styles-test']",
    );
    expect(host?.style.position).toBe("fixed");
    expect(host?.style.top).toBe("0px");
    expect(host?.style.left).toBe("0px");
    expect(host?.style.pointerEvents).toBe("none");
    expect(host?.style.zIndex).toBe("2147483647");

    widget.unmount();
  });

  it("exposes host element on instance", () => {
    const widget = createIsolet({
      name: "host-access-test",
      mount: () => {},
    });

    expect(widget.host).toBeNull();

    const target = document.createElement("div");
    widget.mount(target);

    expect(widget.host).toBeInstanceOf(HTMLElement);
    expect(widget.host?.getAttribute("data-isolet")).toBe("host-access-test");

    widget.unmount();
    expect(widget.host).toBeNull();
  });

  it("host is null in none mode", () => {
    const widget = createIsolet({
      name: "none-host-test",
      mount: () => {},
      isolation: "none",
    });

    const target = document.createElement("div");
    widget.mount(target);

    expect(widget.host).toBeNull();
    expect(widget.container).toBe(target);

    widget.unmount();
  });

  it("applies hostStyles in scoped mode", () => {
    const widget = createIsolet({
      name: "scoped-styles-test",
      mount: () => {},
      isolation: "scoped",
      hostStyles: {
        position: "fixed",
        pointerEvents: "none",
      },
    });

    const target = document.createElement("div");
    widget.mount(target);

    const host = target.querySelector<HTMLElement>(
      "[data-isolet='scoped-styles-test']",
    );
    expect(host?.style.position).toBe("fixed");
    expect(host?.style.pointerEvents).toBe("none");

    widget.unmount();
  });
});
