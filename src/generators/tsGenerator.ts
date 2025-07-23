import { ParsedField } from "../loaders/tsSchemaMongooseLoader.js";

export function generateInterface(name: string, fields: ParsedField[]): string {
  const lines = [`export interface ${name} {`];
  for (const field of fields) {
    lines.push(`  ${field.name}${field.optional ? "?" : ""}: ${field.type};`);
  }

  lines.push("}");
  return lines.join("\n");
}
