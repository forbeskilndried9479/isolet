import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const FIXTURE_DIR = resolve(import.meta.dirname, "fixtures/basic-widget");
const DIST_DIR = resolve(FIXTURE_DIR, "dist");
const CLI_PATH = resolve(import.meta.dirname, "../dist/cli.mjs");

describe("isolet build", () => {
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
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    expect(iife).toBeDefined();
  });

  it("produces ESM output", () => {
    const files = fs.readdirSync(DIST_DIR);
    const esm = files.find((f) => f.endsWith(".js") && !f.includes("iife") && !f.includes("global"));
    expect(esm).toBeDefined();
  });

  it("inlines CSS from config styles field into the IIFE bundle", () => {
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

    expect(content).toContain("font-family");
    expect(content).toContain("sans-serif");
    expect(content).toContain("#1a1a2e");
  });

  it("contains createIsolet in the bundle", () => {
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

    expect(content).toContain("createIsolet");
  });

  it("exposes the configured globalName", () => {
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

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
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

    expect(content).not.toContain("url(./icon.svg)");

    const dataUriMatch = content.match(/data:image\/svg\+xml,([^"')\s]+)/);
    expect(dataUriMatch).toBeTruthy();

    const decoded = decodeURIComponent(dataUriMatch![1]!);
    expect(decoded).toContain("<svg");
    expect(decoded).toContain("<circle");
    expect(decoded).toContain('fill="#e0e0e0"');
  });

  it("inlines static asset imports as data URIs that decode to real SVG", () => {
    const files = fs.readdirSync(DIST_DIR);
    const esm = files.find((f) => f.endsWith(".js") && !f.includes("iife") && !f.includes("global"));
    const content = fs.readFileSync(resolve(DIST_DIR, esm!), "utf8");

    const dataUriMatch = content.match(/data:image\/svg\+xml,([^"')\s]+)/);
    expect(dataUriMatch).toBeTruthy();

    const decoded = decodeURIComponent(dataUriMatch![1]!);
    expect(decoded).toContain("<svg");
    expect(decoded).toContain("<circle");
  });

  it("bundle is fully self-contained (no external requires)", () => {
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

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
    const files = fs.readdirSync(DIST_DIR);
    const iife = files.find((f) => f.endsWith(".global.js") || f.endsWith(".iife.js"));
    const content = fs.readFileSync(resolve(DIST_DIR, iife!), "utf8");

    expect(content).toContain(".widget");
    expect(content).toContain(".widget-icon");
    expect(content).toContain("background-image");
    expect(content).toContain("padding");
  });
});
