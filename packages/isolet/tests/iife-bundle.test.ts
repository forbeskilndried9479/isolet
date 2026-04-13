import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { resolve } from "node:path";

describe("IIFE bundle", () => {
  const bundlePath = resolve(import.meta.dirname, "../dist/index.iife.js");

  it("exists", () => {
    expect(fs.existsSync(bundlePath)).toBe(true);
  });

  it("is self-contained (no require/import statements)", () => {
    const content = fs.readFileSync(bundlePath, "utf8");

    // IIFE should not have bare require() or import() calls that reference external modules
    // It can have internal require-like patterns from the bundler
    const lines = content.split("\n");
    const externalRequires = lines.filter(
      (line) =>
        /\brequire\s*\(\s*["'](?!\.)[^"']+["']\s*\)/.test(line) &&
        !line.includes("__require"),
    );
    expect(externalRequires).toEqual([]);
  });

  it("exposes Isolet global", () => {
    const content = fs.readFileSync(bundlePath, "utf8");
    expect(content).toContain("Isolet");
  });

  it("contains createIsolet export", () => {
    const content = fs.readFileSync(bundlePath, "utf8");
    expect(content).toContain("createIsolet");
  });

  it("contains mountContainer export", () => {
    const content = fs.readFileSync(bundlePath, "utf8");
    expect(content).toContain("mountContainer");
  });
});
