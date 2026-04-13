import fs from "node:fs";
import { resolve } from "node:path";
import { createJiti } from "jiti";
import type { IsoletBuildConfig } from "../../src/define-config.js";

export type { IsoletBuildConfig };

const CONFIG_FILES = [
  "isolet.config.ts",
  "isolet.config.mts",
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
): Promise<IsoletBuildConfig | IsoletBuildConfig[]> => {
  const configPath = findConfig(cwd);
  if (!configPath) {
    throw new Error(
      "No isolet config found. Run `isolet init` to create one.",
    );
  }

  if (configPath.endsWith(".json")) {
    const content = fs.readFileSync(configPath, "utf8");
    try {
      return JSON.parse(content) as IsoletBuildConfig;
    } catch {
      throw new Error(`Invalid JSON in ${configPath}`);
    }
  }

  const jiti = createJiti(configPath, { interopDefault: true });
  const mod = (await jiti.import(configPath)) as
    | IsoletBuildConfig
    | IsoletBuildConfig[];
  return mod;
};
