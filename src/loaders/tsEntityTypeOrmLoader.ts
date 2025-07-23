import { Project, PropertyDeclaration, SourceFile } from "ts-morph";
import { ParsedField } from "./tsSchemaMongooseLoader.js";
import { normalizeType } from "../utilities/normalizeType.js";
import chalk from "chalk";

export function parseTypeormModelFile(filePath: string): ParsedField[] {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

  const classDecl = sourceFile
    .getClasses()
    .find((cls) => cls.getDecorators().some((d) => d.getName() === "Entity"));

  if (!classDecl) {
    const msg = `No class with @Entity decorator found in ${filePath}`;
    const [prefix, ...rest] = msg.split(":");
    throw new Error(chalk.redBright(prefix + ":") + rest.join(":"));
  }
  const relationDecorators = [
    "ManyToOne",
    "OneToMany",
    "OneToOne",
    "ManyToMany",
  ];
  const isColumn = (prop: PropertyDeclaration) => {
    return prop
      .getDecorators()
      .some((d) =>
        [
          "Column",
          "PrimaryGeneratedColumn",
          "CreateDateColumn",
          "UpdateDateColumn",
          "ManyToOne",
          "OneToMany",
          "OneToOne",
          "ManyToMany",
          "JoinColumn",
        ].includes(d.getName())
      );
  };

  const propClass = classDecl.getProperties();
  const parsedFields: ParsedField[] = propClass
    .filter(isColumn) //
    .map((prop) => {
      const name = prop.getName();
      const rawType = prop.getType().getText();
      const type = normalizeType(rawType);
      const optional = prop.hasQuestionToken();

      const relationDecorator = prop
        .getDecorators()
        .find((d) => relationDecorators.includes(d.getName()));

      if (relationDecorator) {
        const relationType = relationDecorator.getName() as
          | "ManyToOne"
          | "OneToMany"
          | "OneToOne"
          | "ManyToMany";
        const arg = relationDecorator.getArguments()[0];

        let relatedEntity: string | undefined;

        if (arg && arg.getText) {
          const match = arg.getText().match(/=>\s*(\w+)/); // match "Department" in "() => Department"
          relatedEntity = match?.[1];
        }
        return {
          name,
          type,
          optional,
          isRelation: true,
          relationType,
          relatedEntity,
        };
      }
      return { name, type, optional };
    });
  return parsedFields;
}
