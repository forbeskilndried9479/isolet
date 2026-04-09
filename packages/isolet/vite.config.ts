import { defineConfig } from "vite-plus";
import { cssTextPlugin } from "./plugins/css-text.js";

export default defineConfig({
  pack: [
    {
      entry: ["./src/index.ts"],
      format: ["iife"],
      globalName: "globalThis.__ISOLET__",
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
      plugins: [cssTextPlugin()],
    },
    {
      entry: [
        "./src/index.ts",
        "./src/runtime.ts",
        "./src/adapters/react.ts",
        "./src/adapters/vanilla.ts",
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
      plugins: [cssTextPlugin()],
    },
  ],
});
