# isolet

> **Warning:** This project is very experimental. APIs may change without notice.

Package any component into a self-contained, isolated widget.

Works with React, Solid, Svelte, vanilla JS, or anything that can render into a DOM element. Ships as a script tag, ESM import, or CommonJS require.

## Install

```sh
npm install isolet-js
```

## Quick start

The core API is one function: `createIsolet`. You give it a name, a mount function, and optionally some CSS. It gives you back `mount`, `update`, and `unmount`.

```ts
import { createIsolet } from "isolet-js";

const widget = createIsolet({
  name: "hello",
  mount(container, props) {
    container.innerHTML = `<h1>Hello, ${props.name}!</h1>`;
  },
  css: `h1 { color: tomato; font-family: sans-serif; }`,
});

widget.mount(document.body, { name: "World" });
```

The component renders inside a shadow DOM by default. Styles are scoped. Nothing leaks in or out.

## Framework adapters

Adapters are thin wrappers that handle framework-specific mounting. The core doesn't import or depend on any framework.

### React

```ts
import { createIsolet } from "isolet-js";
import { react } from "isolet-js/react";
import { MyComponent } from "./MyComponent";

const widget = createIsolet({
  name: "my-widget",
  mount: react(MyComponent),
  css: styles,
});

widget.mount(document.body, { title: "Hello" });
widget.update({ title: "Updated" });
widget.unmount();
```

### Vanilla

```ts
import { createIsolet } from "isolet-js";
import { vanilla } from "isolet-js/vanilla";

const widget = createIsolet({
  name: "counter",
  mount: vanilla((container, props) => {
    let count = props.initial ?? 0;
    const btn = document.createElement("button");
    btn.textContent = `Count: ${count}`;
    btn.onclick = () => { btn.textContent = `Count: ${++count}`; };
    container.appendChild(btn);

    return () => container.removeChild(btn);
  }),
});
```

### Bring your own

The `mount` function is just `(container: HTMLElement, props) => cleanup | void`. Use whatever you want:

```ts
// Solid
import { render } from "solid-js/web";

createIsolet({
  name: "solid-widget",
  mount(container, props) {
    const dispose = render(() => <App {...props} />, container);
    return dispose;
  },
});

// Svelte
import App from "./App.svelte";

createIsolet({
  name: "svelte-widget",
  mount(container, props) {
    const app = new App({ target: container, props });
    return () => app.$destroy();
  },
});
```

## Isolation modes

Control how the widget is isolated from the host page.

```ts
createIsolet({
  name: "my-widget",
  mount: myMount,
  isolation: "shadow-dom", // default: full CSS isolation via shadow DOM
});

createIsolet({
  name: "my-widget",
  mount: myMount,
  isolation: "scoped", // plain div wrapper, styles injected globally
});

createIsolet({
  name: "my-widget",
  mount: myMount,
  isolation: "none", // mount directly into the target element
});
```

## CSS injection

Pass CSS as a string. In shadow DOM mode it's scoped to the shadow root. In other modes it's injected as a `<style>` tag.

```ts
import styles from "./widget.css?raw";

createIsolet({
  name: "styled-widget",
  mount: myMount,
  css: styles,
});
```

For build-time CSS inlining, use the included css-text plugin in your vite config:

```ts
// vite.config.ts
import { cssTextPlugin } from "isolet-js/plugins/css-text";
```

## Script tag usage

The IIFE build exposes `globalThis.__ISOLET__`:

```html
<script src="https://unpkg.com/isolet-js/dist/index.iife.js"></script>
<script>
  const { createIsolet } = __ISOLET__;

  const widget = createIsolet({
    name: "inline-widget",
    mount(container) {
      container.innerHTML = "<p>Loaded via script tag</p>";
    },
  });

  widget.mount(document.body);
</script>
```

## CLI

```sh
npx isolet-js-cli init    # scaffold an isolet.config.ts
npx isolet-js-cli build   # bundle widgets from config
```

The config file:

```ts
// isolet.config.ts
import { defineConfig } from "isolet-js";

export default defineConfig({
  name: "my-widget",
  entry: "./src/index.ts",
  styles: "./src/widget.css",
  format: ["iife", "esm"],
  isolation: "shadow-dom",
});
```

## API

### `createIsolet(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | required | Unique identifier for the widget |
| `mount` | `(container, props) => cleanup?` | required | Render function |
| `css` | `string` | - | CSS text to inject |
| `isolation` | `"shadow-dom" \| "scoped" \| "none"` | `"shadow-dom"` | Isolation strategy |
| `shadowMode` | `"open" \| "closed"` | `"open"` | Shadow DOM mode |
| `hostAttributes` | `Record<string, string>` | - | Attributes on host element |
| `zIndex` | `string \| number` | - | z-index on host element |

Returns an `IsoletInstance`:

| Method/Property | Description |
|---|---|
| `mount(target?, props?)` | Mount into target (defaults to `document.body`) |
| `update(props)` | Update with partial props |
| `unmount()` | Unmount and clean up |
| `container` | The render container element |
| `shadowRoot` | The shadow root (if shadow DOM mode) |
| `mounted` | Whether currently mounted |

## License

MIT
