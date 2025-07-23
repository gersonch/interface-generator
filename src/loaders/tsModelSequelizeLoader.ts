import { Project, SourceFile, SyntaxKind } from "ts-morph";
import { normalizeType } from "../utilities/normalizeType.js";
import chalk from "chalk";
import { ParsedField } from "./tsSchemaMongooseLoader.js";

function sequelizeTypeToTs(typeName: string): string {
  typeName = typeName.toLowerCase();
  if (["float", "integer", "double", "real", "decimal"].includes(typeName)) {
    return "number";
  }
  if (["text", "string", "char", "varchar"].includes(typeName)) {
    return "string";
  }
  if (["date", "datetime", "timestamp"].includes(typeName)) {
    return "Date";
  }
  if (["boolean", "bool"].includes(typeName)) {
    return "boolean";
  }
  return "any";
}

export const parseSequelizeModelFile = (filePath: string): ParsedField[] => {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

  //filtramos las variables que contengan sequelize.define
  const modelVars = sourceFile.getVariableDeclarations().filter((v) => {
    const init = v.getInitializerIfKind(SyntaxKind.CallExpression);
    if (!init) return false;
    const expr = init.getExpression();
    return expr.getText().includes(".define");
  });

  if (modelVars.length === 0) {
    const msg = `No Sequelize model declaration found in ${filePath}`;
    const [prefix, ...rest] = msg.split(":");
    throw new Error(chalk.redBright(prefix + ":") + rest.join(":"));
  }

  // obtener el primer modelo encontrado
  const model = modelVars[0];
  const callExpr = model.getInitializerIfKindOrThrow(SyntaxKind.CallExpression);

  // obtnemos el segundo argumento de sequelize.define
  // que es el objeto con los atributos del modelo
  const attributesArg = callExpr.getArguments()[1];
  if (
    !attributesArg ||
    !attributesArg.asKind(SyntaxKind.ObjectLiteralExpression)
  ) {
    throw new Error(
      `Expected an object literal expression in 'sequelize.define(...)' in ${filePath}`
    );
  }

  const objectLiteral = attributesArg.asKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  );

  const parsedFields: ParsedField[] = objectLiteral
    .getProperties()
    .flatMap((prop) => {
      if (!prop.isKind(SyntaxKind.PropertyAssignment)) return [];

      const name = prop.getName();
      const initializer = prop.getInitializer();
      if (!initializer) return [];

      let type = "any";
      let optional = false; // Inicializa como false por defecto

      // 🔸 Caso: String, Number, etc.
      if (initializer.isKind(SyntaxKind.Identifier)) {
        type = normalizeType(initializer.getText().toLowerCase());
        // Sequelize por defecto allowNull: true, así que podrías poner optional = true aquí si quieres
        optional = true;
      }

      // 🔸 Caso objeto { type: String, ... } o { enum: [...] }
      else if (initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const objProps = initializer.getProperties();

        // 👉 Determinar si el campo es opcional
        const allowNullProp = objProps.find(
          (p) =>
            p.isKind(SyntaxKind.PropertyAssignment) &&
            p.getName() === "allowNull"
        );

        // Si allowNull está presente y es true, es opcional. Si no está, Sequelize lo considera true (opcional).
        if (!allowNullProp) {
          optional = true;
        } else {
          optional =
            allowNullProp.isKind(SyntaxKind.PropertyAssignment) &&
            allowNullProp.getInitializer()?.getText() === "true";
        }

        const typeProp = objProps.find(
          (p) =>
            p.isKind(SyntaxKind.PropertyAssignment) && p.getName() === "type"
        );

        if (typeProp && typeProp.isKind(SyntaxKind.PropertyAssignment)) {
          const typeInit = typeProp.getInitializer();
          let typeName: string | undefined;
          if (typeInit && typeInit.isKind(SyntaxKind.Identifier)) {
            typeName = typeInit.getText();
          } else if (typeInit?.isKind(SyntaxKind.PropertyAccessExpression)) {
            typeName = typeInit.getText().split(".")[1];
          }
          if (typeName) {
            type = sequelizeTypeToTs(typeName);
          }
        }
      }

      return [{ name, type, optional }];
    });

  return parsedFields;
};
