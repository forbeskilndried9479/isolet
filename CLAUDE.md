# isolet

Package any component into a self-contained, isolated widget. Framework-agnostic.

## What it does

Takes a component (React, Solid, Svelte, vanilla, anything) + its styles, bundles everything into a single distributable artifact that:
- Renders inside shadow DOM, a scoped div, or directly into a target
- Inlines all CSS as JS strings (no external stylesheets)
- Outputs IIFE (script tag), ESM, and CJS formats
- Zero framework opinion in the core. Bring your own mount/unmount.

## Architecture

- pnpm monorepo with turbo for orchestration
- vite-plus (`defineConfig` + `pack`) for building (tsdown under the hood)
- css-text plugin converts `.css` imports to JS string exports for shadow DOM injection

## Packages

- `packages/isolet`: core runtime (`createIsolet`, `mountContainer`, adapters) + `defineConfig` for config files
- `packages/cli`: CLI tool (`isolet init`, `isolet build`)
- `apps/`: demo/test apps

## CLI

```sh
isolet init          # scaffold isolet.config.ts
isolet build         # bundle widgets from config
isolet build --watch # watch mode
```

## Key source files

- `packages/isolet/src/create-isolet.ts`: core factory, framework-agnostic
- `packages/isolet/src/mount-shadow-root.ts`: container creation (shadow-dom, scoped, none)
- `packages/isolet/src/inject-styles.ts`: style injection with CSP nonce support
- `packages/isolet/src/adapters/react.ts`: React adapter
- `packages/isolet/src/adapters/vanilla.ts`: vanilla DOM adapter
- `packages/isolet/plugins/css-text.ts`: rollup plugin, CSS to JS strings

## Commands

- `pnpm build`: build all packages
- `pnpm dev`: dev mode with watch
- `pnpm lint` / `pnpm format`: via vite-plus
- `pnpm typecheck`: TypeScript checking
