import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const CLI_PATH = resolve(import.meta.dirname, "../dist/cli.mjs");

const findIife = (dir: string) => {
  const files = fs.readdirSync(dir);
  return files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
};

const findEsm = (dir: string) => {
  const files = fs.readdirSync(dir);
  return files.find(
    (f) => f.endsWith(".js") && !f.includes("iife") && !f.includes("global"),
  );
};

const readBundle = (dir: string, finder: (dir: string) => string | undefined) => {
  const file = finder(dir);
  if (!file) throw new Error("Bundle not found");
  return fs.readFileSync(resolve(dir, file), "utf8");
};

describe("isolet build", () => {
  const FIXTURE_DIR = resolve(import.meta.dirname, "fixtures/basic-widget");
  const DIST_DIR = resolve(FIXTURE_DIR, "dist");

  beforeAll(() => {
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true });
    }

    execSync(`node ${CLI_PATH} build --cwd ${FIXTURE_DIR}`, {
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "development" },
    });
  });

  afterAll(() => {
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true });
    }
  });

  it("produces IIFE output", () => {
    expect(findIife(DIST_DIR)).toBeDefined();
  });

  it("produces ESM output", () => {
    expect(findEsm(DIST_DIR)).toBeDefined();
  });

  it("inlines CSS from config styles field into the IIFE bundle", () => {
    const content = readBundle(DIST_DIR, findIife);

    expect(content).toContain("font-family");
    expect(content).toContain("sans-serif");
    expect(content).toContain("#1a1a2e");
  });

  it("contains createIsolet in the bundle", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).toContain("createIsolet");
  });

  it("exposes the configured globalName", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).toContain("BasicWidget");
  });

  it("does not contain raw file paths in output", () => {
    const files = fs.readdirSync(DIST_DIR);
    for (const file of files) {
      if (!file.endsWith(".js")) continue;
      const content = fs.readFileSync(resolve(DIST_DIR, file), "utf8");
      expect(content).not.toContain("./src/styles.css");
      expect(content).not.toContain("./icon.svg");
    }
  });

  it("inlines CSS url() references as data URIs that decode to real SVG", () => {
    const content = readBundle(DIST_DIR, findIife);

    expect(content).not.toContain("url(./icon.svg)");

    const dataUriMatch = content.match(/data:image\/svg\+xml,([^"')\s]+)/);
    expect(dataUriMatch).toBeTruthy();

    const decoded = decodeURIComponent(dataUriMatch![1]!);
    expect(decoded).toContain("<svg");
    expect(decoded).toContain("<circle");
    expect(decoded).toContain('fill="#e0e0e0"');
  });

  it("inlines static asset imports as data URIs that decode to real SVG", () => {
    const content = readBundle(DIST_DIR, findEsm);

    const dataUriMatch = content.match(/data:image\/svg\+xml,([^"')\s]+)/);
    expect(dataUriMatch).toBeTruthy();

    const decoded = decodeURIComponent(dataUriMatch![1]!);
    expect(decoded).toContain("<svg");
    expect(decoded).toContain("<circle");
  });

  it("bundle is fully self-contained (no external requires)", () => {
    const content = readBundle(DIST_DIR, findIife);

    const externalRequires = content
      .split("\n")
      .filter(
        (line) =>
          /\brequire\s*\(\s*["'](?!\.)[^"']+["']\s*\)/.test(line) &&
          !line.includes("__require"),
      );
    expect(externalRequires).toEqual([]);
  });

  it("CSS in bundle contains full stylesheet with all properties", () => {
    const content = readBundle(DIST_DIR, findIife);

    expect(content).toContain(".widget");
    expect(content).toContain(".widget-icon");
    expect(content).toContain("background-image");
    expect(content).toContain("padding");
  });

  it("IIFE bundle contains auto-mount code targeting document.documentElement", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).toContain("document.documentElement");
  });

  it("ESM bundle does NOT contain auto-mount code", () => {
    const content = readBundle(DIST_DIR, findEsm);
    expect(content).not.toContain("document.documentElement");
  });

  it("replaces process.env.NODE_ENV so no raw process reference remains", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).not.toMatch(/\bprocess\.env\b/);
  });

  it("ESM bundle also has process.env.NODE_ENV replaced", () => {
    const content = readBundle(DIST_DIR, findEsm);
    expect(content).not.toMatch(/\bprocess\.env\b/);
  });
});

describe("isolet build (autoMount: false)", () => {
  const FIXTURE_DIR = resolve(import.meta.dirname, "fixtures/no-automount-widget");
  const DIST_DIR = resolve(FIXTURE_DIR, "dist");

  beforeAll(() => {
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true });
    }

    execSync(`node ${CLI_PATH} build --cwd ${FIXTURE_DIR}`, {
      stdio: "pipe",
      env: { ...process.env, NODE_ENV: "development" },
    });
  });

  afterAll(() => {
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true });
    }
  });

  it("produces IIFE output", () => {
    expect(findIife(DIST_DIR)).toBeDefined();
  });

  it("IIFE does NOT contain auto-mount code when autoMount is false", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).not.toContain("document.documentElement");
  });

  it("still exposes the configured globalName", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).toContain("NoAutoMountWidget");
  });

  it("still replaces process.env.NODE_ENV", () => {
    const content = readBundle(DIST_DIR, findIife);
    expect(content).not.toMatch(/\bprocess\.env\b/);
  });
});
