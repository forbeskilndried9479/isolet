import { Command } from "commander";
import { init } from "./commands/init.js";
import { build } from "./commands/build.js";

const program = new Command();

program
  .name("isolet")
  .description("Package components into self-contained, isolated widgets")
  .version("0.0.1");

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
