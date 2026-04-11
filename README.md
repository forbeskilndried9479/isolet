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

```tsx
import { createIsolet } from "isolet-js";
import { react } from "isolet-js/react";

function Hello({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

const widget = createIsolet({
  name: "hello",
  mount: react(Hello),
  css: `h1 { color: tomato; font-family: sans-serif; }`,
});

widget.mount(document.body, { name: "World" });
```

The component renders inside a shadow DOM by default. Styles are scoped. Nothing leaks in or out.

## CLI

Distribute your component as a self-contained bundle. The CLI reads your config, resolves CSS + assets, and outputs a drop-in artifact.

```sh
npx isolet-js init    # scaffold an isolet.config.ts
npx isolet-js build   # bundle widget(s) from config
npx isolet-js build --watch   # rebuild on changes
npx isolet-js build --minify  # minified production build
```

### Config

```ts
// isolet.config.ts
import { defineConfig } from "isolet-js";

export default defineConfig({
  name: "my-widget",
  entry: "./src/index.ts",
  styles: "./src/widget.css",       // CSS to inline (url() assets auto-resolved)
  format: ["iife", "esm"],          // output formats
  // outDir: "./dist",              // output directory (default: "dist")
  // globalName: "MyWidget",        // global name for IIFE builds
  // external: ["react"],           // don't bundle these
  // dts: true,                     // emit .d.ts files
  // minify: true,                  // minify output
  // platform: "browser",           // target platform (default: "browser")
});
```

You can also export an array for multiple widgets:

```ts
export default defineConfig([
  { name: "widget-a", entry: "./src/a.ts", styles: "./src/a.css" },
  { name: "widget-b", entry: "./src/b.ts", format: ["esm"] },
]);
```

### What the build does

- Reads `styles` from config, inlines all `url()` references (fonts, images) as data URIs
- Makes processed CSS available as `__ISOLET_CSS__` in your entry code
- Converts all `.css` imports to JS string exports (shadow DOM safe)
- Inlines static asset imports (`.png`, `.woff2`, `.mp3`, etc.) as data URIs
- Resolves `styles: "./path.css"` in `createIsolet`/`defineElement` calls at build time
- Outputs IIFE (script tag), ESM, and/or CJS depending on `format`

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

## CSS & asset handling

`isolet build` automatically handles CSS and assets — no manual plugin setup required:

- **`styles` in config** → CSS files are read, all `url()` references (fonts, images) are inlined as data URIs, and the result is available as `__ISOLET_CSS__` in your entry
- **`.css` imports** → converted to JS string exports (shadow DOM safe)
- **Asset imports** (`.png`, `.woff2`, `.mp3`, etc.) → inlined as data URIs
- **`styles: "./path.css"` in `createIsolet`/`defineElement`** → resolved and inlined at build time

```ts
// Your entry file — just reference css, the CLI handles the rest
createIsolet({
  name: "my-widget",
  css: __ISOLET_CSS__,  // injected by isolet build from config styles field
  mount: myMount,
});

// Or inline the path directly:
createIsolet({
  name: "my-widget",
  styles: "./widget.css",  // auto-resolved at build time
  mount: myMount,
});
```

If you're using `vp pack` or Vite directly instead of the CLI, add the plugins manually:

```ts
// vite.config.ts
import { cssTextPlugin, inlineAssetsPlugin, autoStylesPlugin } from "isolet-js/plugins";
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
