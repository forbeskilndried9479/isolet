export interface IsoletBuildConfig {
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

export const defineConfig = (
  config: IsoletBuildConfig | IsoletBuildConfig[],
): IsoletBuildConfig | IsoletBuildConfig[] => config;
