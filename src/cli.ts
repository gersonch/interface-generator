import { Command } from "commander";
import { generateFromModel } from "./index.js";
import inquirer from "inquirer";
import chalk from "chalk";

const program = new Command();

program
  .name(chalk.cyanBright("genInt"))
  .description(
    chalk.greenBright(
      "✨ Genera interfaces TypeScript desde archivos de modelo ✨"
    )
  )
  .version("1.0.0");

program
  .command("from <filePath>")
  .requiredOption("-o, --output <output>", chalk.yellow("Archivo de salida"))
  .option(
    "-r, --orm <orm>",
    chalk.yellow("ORM u ODM a usar (mongoose, typeorm, sequelize)")
  )
  .description(
    chalk.magentaBright(
      "🛠️ Generate a TypeScript interface from a schema, model, or entity 🛠️"
    )
  )
  .action(async (filePath, options) => {
    let orm = options.orm;
    if (!orm) {
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "orm",
          message: chalk.blueBright("¿Qué ORM/ODM deseas utilizar?"),
          choices: [
            { name: chalk.green("Mongoose 🟢"), value: "mongoose" },
            { name: chalk.cyan("TypeORM 🔵"), value: "typeorm" },
            { name: chalk.yellow("Sequelize 🟡"), value: "sequelize" },
          ],
        },
      ]);
      orm = answer.orm;
      console.log(chalk.bold(`Selected ORM/ODM: ${chalk.underline(orm)}`));
    }
    console.log(chalk.cyanBright("🚀 Generating interface..."));
    try {
      await generateFromModel(filePath, { ...options, orm });
      console.log(chalk.greenBright("✅ Process completed."));
    } catch (error) {
      let msg = "❌ Error generating interface.";
      if (error instanceof Error) {
        msg += " " + error.message;
      } else if (typeof error === "string") {
        msg += " " + error;
      }
      console.error(chalk.redBright(msg));
      return;
    }
  });

program.parse(process.argv);
