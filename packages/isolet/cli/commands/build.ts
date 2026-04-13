import fs from "node:fs";
import { resolve } from "node:path";
import { build as tsdownBuild, type UserConfig } from "tsdown";
import {
  cssTextPlugin,
  inlineAssetsPlugin,
  autoStylesPlugin,
  processCss,
} from "../../plugins/plugins.js";
import { loadConfig, type IsoletBuildConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface BuildOptions {
  cwd: string;
  watch?: boolean;
  minify?: boolean;
}

const resolveStyles = (
  config: IsoletBuildConfig,
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

const wrapperEntryPlugin = (userEntry: string, autoMount: boolean = false) => {
  return {
    name: "isolet-wrapper-entry",
    resolveId(source: string) {
      if (source === VIRTUAL_ENTRY_ID) return VIRTUAL_ENTRY_ID;
    },
    load(id: string) {
      if (id !== VIRTUAL_ENTRY_ID) return;
      const lines: string[] = [];
      if (autoMount) {
        lines.push(
          `import * as __isolet_exports__ from ${JSON.stringify(userEntry)};`,
        );
      }
      lines.push(`export * from ${JSON.stringify(userEntry)};`);
      if (autoMount) {
        lines.push(`for (var __k in __isolet_exports__) {`);
        lines.push(`  var __v = __isolet_exports__[__k];`);
        lines.push(
          `  if (__v && typeof __v === 'object' && 'mount' in __v && 'mounted' in __v && !__v.mounted) {`,
        );
        lines.push(`    __v.mount(document.documentElement);`);
        lines.push(`  }`);
        lines.push(`}`);
      }
      return lines.join("\n");
    },
  };
};

const toTsdownConfigs = (
  config: IsoletBuildConfig,
  cwd: string,
  overrides: { watch?: boolean; minify?: boolean },
): UserConfig[] => {
  const outDir = resolve(cwd, config.outDir ?? "dist");
  const formats = config.format ?? ["iife", "esm"];
  const minify = overrides.minify ?? config.minify ?? false;
  const watch = overrides.watch ?? false;
  const cssText = resolveStyles(config, cwd);
  const userEntry = resolve(cwd, config.entry);
  const autoMount = config.autoMount !== false;

  const makePlugins = () => [
    cssTextPlugin(),
    inlineAssetsPlugin(),
    autoStylesPlugin(),
  ];

  const define: Record<string, string> = {
    "process.env.NODE_ENV": JSON.stringify("production"),
  };

  if (cssText) {
    define["__ISOLET_CSS__"] = JSON.stringify(cssText);
  }

  const baseConfig = {
    outDir,
    globalName: config.globalName,
    external: config.external,
    dts: config.dts ?? false,
    minify,
    watch,
    platform: (config.platform ?? "browser") as UserConfig["platform"],
    clean: false,
    define,
  };

  const needsWrapper = cssText != null;
  const hasIife = formats.includes("iife");
  const nonIifeFormats = formats.filter(
    (f): f is "esm" | "cjs" => f !== "iife",
  );
  const shouldAutoMount = autoMount && hasIife;

  if (shouldAutoMount && nonIifeFormats.length > 0) {
    return [
      {
        ...baseConfig,
        entry: [VIRTUAL_ENTRY_ID],
        format: ["iife"] as UserConfig["format"],
        dts: false,
        plugins: [...makePlugins(), wrapperEntryPlugin(userEntry, true)] as any,
      },
      {
        ...baseConfig,
        entry: [needsWrapper ? VIRTUAL_ENTRY_ID : userEntry],
        format: nonIifeFormats as UserConfig["format"],
        plugins: (needsWrapper
          ? [...makePlugins(), wrapperEntryPlugin(userEntry, false)]
          : makePlugins()) as any,
      },
    ];
  }

  if (shouldAutoMount || needsWrapper) {
    return [
      {
        ...baseConfig,
        entry: [VIRTUAL_ENTRY_ID],
        format: formats as UserConfig["format"],
        plugins: [
          ...makePlugins(),
          wrapperEntryPlugin(userEntry, shouldAutoMount),
        ] as any,
      },
    ];
  }

  return [
    {
      ...baseConfig,
      entry: [userEntry],
      format: formats as UserConfig["format"],
      plugins: makePlugins() as any,
    },
  ];
};

export const build = async (options: BuildOptions) => {
  const cwd = resolve(options.cwd);

  let configs: IsoletBuildConfig[];
  try {
    const loaded = await loadConfig(cwd);
    configs = Array.isArray(loaded) ? loaded : [loaded];
  } catch (err) {
    log.error((err as Error).message);
    process.exit(1);
  }

  for (const config of configs) {
    log.info(`Building isolet: ${config.name}`);

    const tsdownConfigs = toTsdownConfigs(config, cwd, {
      watch: options.watch,
      minify: options.minify,
    });

    log.info(`Entry: ${config.entry}`);
    log.info(`Output: ${tsdownConfigs[0]!.outDir}`);
    log.info(`Formats: ${(config.format ?? ["iife", "esm"]).join(", ")}`);
    if (tsdownConfigs[0]!.minify) log.info("Minification: enabled");
    if (options.watch) log.info("Watch mode: enabled");

    try {
      for (const tsdownConfig of tsdownConfigs) {
        await tsdownBuild(tsdownConfig);
      }
      log.success(`Built ${config.name}`);
    } catch (err) {
      log.error(`Failed to build ${config.name}: ${(err as Error).message}`);
      process.exit(1);
    }

    log.break();
  }
};
