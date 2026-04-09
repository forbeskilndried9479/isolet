import { resolve } from "node:path";
import { loadConfig, type IsoletConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface BuildOptions {
  cwd: string;
  watch?: boolean;
  minify?: boolean;
}

export const build = async (options: BuildOptions) => {
  const cwd = resolve(options.cwd);

  let configs: IsoletConfig[];
  try {
    const loaded = await loadConfig(cwd);
    configs = Array.isArray(loaded) ? loaded : [loaded];
  } catch (err) {
    log.error((err as Error).message);
    process.exit(1);
  }

  for (const config of configs) {
    log.info(`Building isolet: ${config.name}`);

    const outDir = resolve(cwd, config.outDir ?? "dist");
    const formats = config.format ?? ["iife", "esm"];
    const minify = options.minify ?? config.minify ?? false;

    log.info(`Entry: ${config.entry}`);
    log.info(`Output: ${outDir}`);
    log.info(`Formats: ${formats.join(", ")}`);
    if (minify) log.info("Minification: enabled");
    if (options.watch) log.info("Watch mode: enabled");

    // TODO: invoke vite-plus pack programmatically with the resolved config
    // For now, print what would be built
    log.warn(
      "Programmatic build not yet wired - use `vp pack` with vite.config.ts directly for now.",
    );
    log.break();
  }
};
