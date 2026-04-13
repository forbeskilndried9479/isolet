import { injectStyles } from "./inject-styles.js";

const ATTRIBUTE_NAME = "data-isolet";

export interface MountResult {
  host: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
  container: HTMLElement;
  target: HTMLElement;
}

export const mountContainer = (
  name: string,
  target: HTMLElement,
  options: {
    isolation?: "shadow-dom" | "scoped" | "none";
    css?: string;
    shadowMode?: ShadowRootMode;
    hostAttributes?: Record<string, string>;
    hostStyles?: Partial<CSSStyleDeclaration>;
    zIndex?: string | number;
  } = {},
): MountResult => {
  if (typeof document === "undefined") {
    return { host: null, shadowRoot: null, container: target, target };
  }

  const isolation = options.isolation ?? "shadow-dom";

  if (isolation === "none") {
    const selector = `[${ATTRIBUTE_NAME}="${name}"]`;
    const existing = target.querySelector<HTMLElement>(selector);
    if (existing) {
      return { host: existing, shadowRoot: null, container: existing, target };
    }

    const host = document.createElement("div");
    host.setAttribute(ATTRIBUTE_NAME, name);

    if (options.hostAttributes) {
      for (const [key, value] of Object.entries(options.hostAttributes)) {
        host.setAttribute(key, value);
      }
    }

    applyHostStyles(host, options);
    if (options.css) injectStyles(name, options.css, target);
    target.appendChild(host);
    return { host, shadowRoot: null, container: host, target };
  }

  const selector = `[${ATTRIBUTE_NAME}="${name}"]`;
  const existing = target.querySelector<HTMLElement>(selector);
  if (existing) {
    if (isolation === "shadow-dom" && existing.shadowRoot) {
      const container = existing.shadowRoot.querySelector<HTMLElement>(
        `[${ATTRIBUTE_NAME}-root]`,
      );
      if (container) {
        return { host: existing, shadowRoot: existing.shadowRoot, container, target };
      }
    } else if (isolation === "scoped") {
      return { host: existing, shadowRoot: null, container: existing, target };
    }
  }

  const host = document.createElement("div");
  host.setAttribute(ATTRIBUTE_NAME, name);

  if (options.hostAttributes) {
    for (const [key, value] of Object.entries(options.hostAttributes)) {
      host.setAttribute(key, value);
    }
  }

  if (isolation === "shadow-dom") {
    host.style.all = "initial";

    const shadowRoot = host.attachShadow({
      mode: options.shadowMode ?? "open",
    });

    if (options.css) injectStyles(name, options.css, shadowRoot);

    const container = document.createElement("div");
    container.setAttribute(`${ATTRIBUTE_NAME}-root`, "");
    shadowRoot.appendChild(container);

    applyHostStyles(host, options);
    target.appendChild(host);
    return { host, shadowRoot, container, target };
  }

  applyHostStyles(host, options);
  if (options.css) injectStyles(name, options.css, target);
  target.appendChild(host);
  return { host, shadowRoot: null, container: host, target };
};

const applyHostStyles = (
  host: HTMLElement,
  options: {
    hostStyles?: Partial<CSSStyleDeclaration>;
    zIndex?: string | number;
  },
): void => {
  if (options.hostStyles) {
    for (const [prop, value] of Object.entries(options.hostStyles)) {
      if (value == null || typeof value === "function") continue;
      host.style.setProperty(
        prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
        String(value),
      );
    }
  }

  if (options.zIndex != null) {
    host.style.zIndex = String(options.zIndex);
  }
};
