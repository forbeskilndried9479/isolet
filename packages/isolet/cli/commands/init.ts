import fs from "node:fs";
import { resolve } from "node:path";
import prompts from "prompts";
import { findConfig } from "../utils/config.js";
import { log } from "../utils/logger.js";

interface InitOptions {
  yes?: boolean;
  cwd: string;
}

const DEFAULT_CONFIG = `import { defineConfig } from "isolet-js";

export default defineConfig({
  name: "my-widget",
  entry: "./src/Widget.tsx",
  styles: "./src/widget.css",
  format: ["iife", "esm"],
});
`;

export const init = async (options: InitOptions) => {
  const cwd = resolve(options.cwd);
  const existing = findConfig(cwd);

  if (existing) {
    log.warn(`Config already exists: ${existing}`);
    if (!options.yes) {
      const { overwrite } = await prompts({
        type: "confirm",
        name: "overwrite",
        message: "Overwrite existing config?",
        initial: false,
      });
      if (!overwrite) {
        log.info("Aborted.");
        return;
      }
    }
  }

  let config = DEFAULT_CONFIG;

  if (!options.yes) {
    const answers = await prompts([
      {
        type: "text",
        name: "name",
        message: "Widget name",
        initial: "my-widget",
      },
      {
        type: "text",
        name: "entry",
        message: "Component entry point",
        initial: "./src/index.ts",
      },
      {
        type: "text",
        name: "styles",
        message: "CSS file (leave empty for none)",
        initial: "",
      },
      {
        type: "multiselect",
        name: "format",
        message: "Output formats",
        choices: [
          { title: "IIFE (script tag)", value: "iife", selected: true },
          { title: "ESM (import)", value: "esm", selected: true },
          { title: "CJS (require)", value: "cjs", selected: false },
        ],
      },
    ]);

    if (!answers.name) {
      log.info("Aborted.");
      return;
    }

    const formats = (answers.format as string[]).map((f) => `"${f}"`).join(", ");
    const stylesLine = answers.styles
      ? `\n  styles: "${answers.styles}",`
      : "";

    config = `import { defineConfig } from "isolet-js";

export default defineConfig({
  name: "${answers.name}",
  entry: "${answers.entry}",${stylesLine}
  format: [${formats}],
});
`;
  }

  const configPath = resolve(cwd, "isolet.config.ts");
  fs.writeFileSync(configPath, config);
  log.success(`Created ${configPath}`);
};
