import { parseModelFile } from "./loaders/tsSchemaLoader";
import { generateInterface } from "./generators/tsGenerator";
import fs from "fs";
import path from "path";

export async function generateFromModel(
  filePath: string,
  options: { output: string }
) {
  try {
    const fields = parseModelFile(filePath);
    const baseName = path.basename(filePath).replace(/\..+$/, "");
    const interfaceName = `I${capitalize(baseName)}`;

    const content = generateInterface(interfaceName, fields);

    const outputPath = path.resolve(options.output);
    await fs.promises.writeFile(outputPath, content, "utf-8");

    console.log(
      `Interface ${interfaceName} generated successfully at ${outputPath}`
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error generating interface: ${error.message}`);
    } else {
      console.error(`Error generating interface: ${error}`);
    }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
