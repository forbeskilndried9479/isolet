import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { init } from "./commands/init.js";
import { build } from "./commands/build.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(resolve(__dirname, "..", "package.json"), "utf8"),
) as { version: string };

const program = new Command();

program
  .name("isolet")
  .description("Package components into self-contained, isolated widgets")
  .version(pkg.version);

program
  .command("init")
  .description("Initialize an isolet config in the current project")
  .option("-y, --yes", "Skip prompts and use defaults")
  .option("-c, --cwd <path>", "Working directory", process.cwd())
  .action(init);

program
  .command("build")
  .description("Build isolet widget(s) from config")
  .option("-c, --cwd <path>", "Working directory", process.cwd())
  .option("-w, --watch", "Watch mode")
  .option("--minify", "Minify output")
  .action(build);

program.parse();
