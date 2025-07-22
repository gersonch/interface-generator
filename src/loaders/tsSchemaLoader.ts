import { Project, SourceFile } from "ts-morph";

export interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
}

export function parseModelFile(filePath: string): ParsedField[] {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

  const classDecl = sourceFile
    .getClasses()
    .find((cls) => cls.getDecorators().some((d) => d.getName() === "Schema"));

  if (!classDecl) {
    throw new Error(`No class with @Schema decorator found in ${filePath}`);
  }

  const props = classDecl.getProperties();

  const parsedFields: ParsedField[] = props.map((prop) => {
    const name = prop.getName();
    const type = prop.getType().getText();
    const optional = prop.hasQuestionToken();
    return { name, type, optional };
  });
  return parsedFields;
}
