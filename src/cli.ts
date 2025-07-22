import { Command } from "commander";
import { generateFromModel } from "./index";

const program = new Command();

program
  .name("genInt")
  .description("Generates TypeScript interfaces from model files")
  .version("1.0.0");

program
  .command("from <filePath>")
  .requiredOption("-o, --output <output>", "Archivo de salida")
  .description("Genera interfaz TS a partir de un schema NestJS")
  .action((filePath, options) => {
    generateFromModel(filePath, options);
  });

program.parse(process.argv);
