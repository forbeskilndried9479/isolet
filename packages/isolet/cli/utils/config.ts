import fs from "node:fs";
import { resolve } from "node:path";

export interface IsoletConfig {
  name: string;
  entry: string;
  styles?: string | string[];
  outDir?: string;
  format?: ("iife" | "esm" | "cjs")[];
  globalName?: string;
  external?: string[];
  dts?: boolean;
  minify?: boolean;
  platform?: "browser" | "node" | "neutral";
  /**
   * Auto-mount exported isolet instances to `document.documentElement`
   * when loading the IIFE bundle. Defaults to `true`.
   * Only affects IIFE output; ESM/CJS exports are not auto-mounted.
   */
  autoMount?: boolean;
}

const CONFIG_FILES = [
  "isolet.config.ts",
  "isolet.config.js",
  "isolet.config.mjs",
  "isolet.config.json",
];

export const findConfig = (cwd: string): string | null => {
  for (const file of CONFIG_FILES) {
    const path = resolve(cwd, file);
    if (fs.existsSync(path)) return path;
  }
  return null;
};

export const loadConfig = async (
  cwd: string,
): Promise<IsoletConfig | IsoletConfig[]> => {
  const configPath = findConfig(cwd);
  if (!configPath) {
    throw new Error(
      "No isolet config found. Run `isolet init` to create one.",
    );
  }

  if (configPath.endsWith(".json")) {
    const content = fs.readFileSync(configPath, "utf8");
    try {
      return JSON.parse(content) as IsoletConfig;
    } catch {
      throw new Error(`Invalid JSON in ${configPath}`);
    }
  }

  const mod = await import(configPath);
  return mod.default as IsoletConfig | IsoletConfig[];
};
