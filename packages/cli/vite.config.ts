import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["./src/cli.ts", "./src/index.ts"],
    format: ["esm"],
    dts: true,
    platform: "node",
    banner: "#!/usr/bin/env node",
  },
});
