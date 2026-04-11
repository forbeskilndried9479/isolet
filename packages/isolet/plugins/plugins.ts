import fs from "node:fs";
import { dirname, extname, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MIME_TYPES: Record<string, string> = {
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const ASSET_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

const toDataUri = (filePath: string): string | null => {
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) return null;

  try {
    if (ext === ".svg") {
      const raw = fs.readFileSync(filePath, "utf8");
      return `data:${mime},${encodeURIComponent(raw)}`;
    }
    const buf = fs.readFileSync(filePath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
};

const inlineCssUrls = (css: string, cssDir: string): string => {
  return css.replace(
    /url\(\s*(['"]?)(.+?)\1\s*\)/g,
    (original, _quote, ref: string) => {
      if (
        ref.startsWith("data:") ||
        ref.startsWith("http://") ||
        ref.startsWith("https://") ||
        ref.startsWith("#")
      ) {
        return original;
      }
      const assetPath = resolve(cssDir, ref.split("?")[0]!.split("#")[0]!);
      const dataUri = toDataUri(assetPath);
      return dataUri ? `url("${dataUri}")` : original;
    },
  );
};

export const processCss = (cssFilePath: string): string => {
  const raw = fs.readFileSync(cssFilePath, "utf8");
  return inlineCssUrls(raw, dirname(cssFilePath));
};

// ---------------------------------------------------------------------------
// cssTextPlugin — converts .css imports into JS string exports
// ---------------------------------------------------------------------------

const CSS_TEXT_SUFFIX = "?css-text";

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
      return `export default ${JSON.stringify(processCss(filePath))};`;
    },
  };
};

// ---------------------------------------------------------------------------
// inlineAssetsPlugin — inlines static asset imports as data URIs
// ---------------------------------------------------------------------------

const ASSET_SUFFIX = "?inline-asset";

export const inlineAssetsPlugin = () => {
  return {
    name: "isolet-inline-assets",
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
      const ext = extname(source).toLowerCase();
      if (!ASSET_EXTENSIONS.has(ext)) return;

      if (source.startsWith(".") || source.startsWith("/")) {
        const resolved = importer
          ? resolve(dirname(importer), source)
          : source;
        return resolved + ASSET_SUFFIX;
      }
      const resolved = await this.resolve(source, importer);
      if (resolved) return resolved.id + ASSET_SUFFIX;
    },
    load(id: string) {
      if (!id.endsWith(ASSET_SUFFIX)) return;
      const filePath = id.slice(0, -ASSET_SUFFIX.length);
      const dataUri = toDataUri(filePath);
      if (!dataUri) return;
      return `export default ${JSON.stringify(dataUri)};`;
    },
  };
};

// ---------------------------------------------------------------------------
// autoStylesPlugin — resolves `styles: "./path.css"` at build time
// ---------------------------------------------------------------------------

export const autoStylesPlugin = () => {
  return {
    name: "isolet-auto-styles",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!/\.[jt]sx?$/.test(id)) return;
      if (
        !code.includes("createIsolet") &&
        !code.includes("defineElement")
      ) {
        return;
      }

      const fileDir = dirname(id);
      let result = code;
      let changed = false;

      result = result.replace(
        /styles\s*:\s*\[([^\]]*)\]/g,
        (_match, inner: string) => {
          const paths = [...inner.matchAll(/["']([^"']+\.css)["']/g)].map(
            (m) => m[1]!,
          );
          if (paths.length === 0) return _match;

          const combined = paths
            .map((p) => {
              const abs = resolve(fileDir, p);
              if (!fs.existsSync(abs)) return "";
              return processCss(abs);
            })
            .join("\n");

          changed = true;
          return `css: ${JSON.stringify(combined)}`;
        },
      );

      result = result.replace(
        /styles\s*:\s*["']([^"']+\.css)["']/g,
        (_match, cssPath: string) => {
          const abs = resolve(fileDir, cssPath);
          if (!fs.existsSync(abs)) return _match;

          changed = true;
          return `css: ${JSON.stringify(processCss(abs))}`;
        },
      );

      if (changed) return result;
    },
  };
};
