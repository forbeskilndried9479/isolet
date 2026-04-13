import { defineConfig } from "vite-plus";
import { cssTextPlugin, inlineAssetsPlugin } from "./plugins/plugins.js";

export default defineConfig({
  pack: [
    {
      entry: ["./src/index.ts"],
      format: ["iife"],
      globalName: "Isolet",
      dts: false,
      clean: false,
      platform: "browser",
      sourcemap: false,
      minify: process.env.NODE_ENV === "production",
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV ?? "development",
        ),
      },
      plugins: [cssTextPlugin(), inlineAssetsPlugin()],
    },
    {
      entry: [
        "./src/index.ts",
        "./src/runtime.ts",
        "./src/adapters/react.ts",
        "./src/adapters/vanilla.ts",
        "./src/adapters/solid.ts",
        "./src/adapters/preact.ts",
        "./src/adapters/vue.ts",
        "./src/adapters/svelte.ts",
      ],
      format: ["cjs", "esm"],
      dts: true,
      clean: false,
      platform: "neutral",
      sourcemap: false,
      minify: process.env.NODE_ENV === "production",
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV ?? "development",
        ),
      },
      plugins: [cssTextPlugin(), inlineAssetsPlugin()],
    },
    {
      entry: ["./plugins/plugins.ts"],
      format: ["cjs", "esm"],
      dts: true,
      clean: false,
      platform: "node",
      sourcemap: false,
    },
    {
      entry: ["./cli/cli.ts"],
      format: ["esm"],
      dts: false,
      clean: false,
      platform: "node",
      sourcemap: false,
      banner: "#!/usr/bin/env node",
    },
  ],
});
