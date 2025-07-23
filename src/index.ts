import { parseSchemaMongoose } from "./loaders/tsSchemaMongooseLoader.js";
import { generateInterface } from "./generators/tsGenerator.js";
import fs from "fs";
import path, { parse } from "path";
import { parseTypeormModelFile } from "./loaders/tsEntityTypeOrmLoader.js";
import chalk from "chalk";
import { parseSequelizeModelFile } from "./loaders/tsModelSequelizeLoader.js";

export async function generateFromModel(
  filePath: string,
  options: { output: string; orm?: string }
) {
  try {
    let fields;

    switch (options.orm) {
      case "mongoose":
        fields = parseSchemaMongoose(filePath);
        break;
      case "typeorm":
        fields = parseTypeormModelFile(filePath);
        break;
      case "sequelize":
        fields = parseSequelizeModelFile(filePath);
        break;
      default:
        throw new Error("ORM/ODM no soportado o no especificado.");
    }

    const baseName = path.basename(filePath).replace(/\..+$/, "");
    const interfaceName = `I${capitalize(baseName)}`;
    const content = generateInterface(interfaceName, fields);

    const outputPath = path.resolve(options.output);
    await fs.promises.writeFile(outputPath, content, "utf-8");

    console.log(
      chalk.bgGreen(
        `Interface ${interfaceName} generated successfully at ${outputPath}`
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        chalk.redBright(`Error generating interface: ${error.message}`)
      );
    } else {
      console.error(`Error generating interface: ${error}`);
    }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
