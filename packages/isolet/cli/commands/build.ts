import fs from "node:fs";
import { resolve } from "node:path";
import { build as tsdownBuild, type UserConfig } from "tsdown";
import {
  cssTextPlugin,
  inlineAssetsPlugin,
  autoStylesPlugin,
  processCss,
} from "../../plugins/plugins.js";
import { loadConfig, type IsoletConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface BuildOptions {
  cwd: string;
  watch?: boolean;
  minify?: boolean;
}

const resolveStyles = (
  config: IsoletConfig,
  cwd: string,
): string | undefined => {
  if (!config.styles) return undefined;
  const paths = Array.isArray(config.styles)
    ? config.styles
    : [config.styles];
  return paths
    .map((p) => {
      const abs = resolve(cwd, p);
      if (!fs.existsSync(abs)) {
        log.warn(`Styles file not found: ${abs}`);
        return "";
      }
      log.info(`Styles: ${p}`);
      return processCss(abs);
    })
    .join("\n");
};

const VIRTUAL_ENTRY_ID = "\0isolet-entry";

const wrapperEntryPlugin = (userEntry: string) => {
  return {
    name: "isolet-wrapper-entry",
    resolveId(source: string) {
      if (source === VIRTUAL_ENTRY_ID) return VIRTUAL_ENTRY_ID;
    },
    load(id: string) {
      if (id !== VIRTUAL_ENTRY_ID) return;
      return [
        `export * from ${JSON.stringify(userEntry)};`,
        `import __mod from ${JSON.stringify(userEntry)};`,
        `export default __mod;`,
      ].join("\n");
    },
  };
};

const toTsdownConfig = (
  config: IsoletConfig,
  cwd: string,
  overrides: { watch?: boolean; minify?: boolean },
): UserConfig => {
  const outDir = resolve(cwd, config.outDir ?? "dist");
  const formats = config.format ?? ["iife", "esm"];
  const minify = overrides.minify ?? config.minify ?? false;

  const cssText = resolveStyles(config, cwd);
  const userEntry = resolve(cwd, config.entry);

  const plugins = [
    cssTextPlugin(),
    inlineAssetsPlugin(),
    autoStylesPlugin(),
  ];

  const define: Record<string, string> = {};

  if (cssText) {
    define["__ISOLET_CSS__"] = JSON.stringify(cssText);
    plugins.push(wrapperEntryPlugin(userEntry));
  }

  return {
    entry: [cssText ? VIRTUAL_ENTRY_ID : userEntry],
    format: formats,
    outDir,
    globalName: config.globalName,
    external: config.external,
    dts: config.dts ?? false,
    minify,
    platform: config.platform ?? "browser",
    clean: false,
    define,
    plugins,
  };
};

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

    const tsdownConfig = toTsdownConfig(config, cwd, {
      watch: options.watch,
      minify: options.minify,
    });

    log.info(`Entry: ${config.entry}`);
    log.info(`Output: ${tsdownConfig.outDir}`);
    log.info(`Formats: ${(tsdownConfig.format as string[]).join(", ")}`);
    if (tsdownConfig.minify) log.info("Minification: enabled");
    if (options.watch) log.info("Watch mode: enabled");

    try {
      await tsdownBuild(tsdownConfig);
      log.success(`Built ${config.name}`);
    } catch (err) {
      log.error(`Failed to build ${config.name}: ${(err as Error).message}`);
      process.exit(1);
    }

    log.break();
  }
};
