import fs from "node:fs";
import { dirname, resolve } from "node:path";

const CSS_TEXT_SUFFIX = "?css-text";

/**
 * Vite/Rollup plugin that converts CSS file imports into JS string exports.
 * This allows CSS to be inlined into shadow DOM at runtime instead of
 * being linked as external stylesheets.
 */
export const cssTextPlugin = () => {
  return {
    name: "isolet-css-text",
    enforce: "pre" as const,
    async resolveId(
      this: {
        resolve: (
          source: string,
          importer?: string,
        ) => Promise<{ id: string } | null>;
      },
      source: string,
      importer: string | undefined,
    ) {
      if (!source.endsWith(".css")) return;
      if (source.startsWith(".") || source.startsWith("/")) {
        const resolved = importer
          ? resolve(dirname(importer), source)
          : source;
        return resolved + CSS_TEXT_SUFFIX;
      }
      const resolved = await this.resolve(source, importer);
      if (resolved) return resolved.id + CSS_TEXT_SUFFIX;
    },
    load(id: string) {
      if (!id.endsWith(CSS_TEXT_SUFFIX)) return;
      const filePath = id.slice(0, -CSS_TEXT_SUFFIX.length);
      const content = fs.readFileSync(filePath, "utf8");
      return `export default ${JSON.stringify(content)};`;
    },
  };
};
