export interface IsoletBuildConfig {
  name: string;
  entry: string;
  styles?: string | string[];
  outDir?: string;
  format?: ("iife" | "esm" | "cjs")[];
  globalName?: string;
  isolation?: "shadow-dom" | "scoped" | "none";
  shadowMode?: "open" | "closed";
  hostAttributes?: Record<string, string>;
  external?: string[];
  bundle?: string[];
  dts?: boolean;
  minify?: boolean;
  platform?: "browser" | "node" | "neutral";
}

export const defineConfig = (
  config: IsoletBuildConfig | IsoletBuildConfig[],
): IsoletBuildConfig | IsoletBuildConfig[] => config;
