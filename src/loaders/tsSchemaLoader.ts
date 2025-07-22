import { Project, SourceFile, SyntaxKind } from "ts-morph";

export interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
}

function normalizeType(type: string): string {
  const map: Record<string, string> = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Date: "Date",
    ObjectId: "string",
  };
  return map[type] ?? type;
}

export function parseModelFile(filePath: string): ParsedField[] {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  const sourceFile: SourceFile = project.addSourceFileAtPath(filePath);

  const classDecl = sourceFile
    .getClasses()
    .find((cls) => cls.getDecorators().some((d) => d.getName() === "Schema"));

  const schemaDecl = sourceFile
    .getDescendantsOfKind(SyntaxKind.NewExpression)
    .find((exp) => exp.getExpression().getText().includes("Schema"));

  if (!classDecl && !schemaDecl) {
    throw new Error(
      `No class with @Schema decorator or variable with 'new Schema(...)' found in ${filePath}`
    );
  }

  let parsedFields: ParsedField[] = [];

  if (classDecl) {
    const propsClass = classDecl.getProperties();
    parsedFields = propsClass.map((prop) => {
      const name = prop.getName();
      const type = normalizeType(prop.getType().getText());
      const optional = prop.hasQuestionToken();
      return { name, type, optional };
    });
  } else if (schemaDecl) {
    const arg = schemaDecl.getArguments()[0];
    //verifica que sea un objeto
    if (!arg?.asKind(SyntaxKind.ObjectLiteralExpression)) {
      throw new Error(
        `Expected an object literal expression in 'new Schema(...)' in ${filePath}`
      );
    }

    const objectLiteral = arg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    parsedFields = objectLiteral.getProperties().flatMap((prop) => {
      if (!prop.isKind(SyntaxKind.PropertyAssignment)) return [];

      const name = prop.getName();
      const initializer = prop.getInitializer();
      if (!initializer) return [];

      let type = "any";

      // 🔸 Caso: String, Number, etc.
      if (initializer.isKind(SyntaxKind.Identifier)) {
        type = normalizeType(initializer.getText());
      }

      // 🔸 Caso objeto { type: String, ... } o { enum: [...] }
      else if (initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const objProps = initializer.getProperties();

        // 👉 Determinar si el campo es opcional
        const requiredProp = objProps.find(
          (p) =>
            p.isKind(SyntaxKind.PropertyAssignment) &&
            p.getName() === "required"
        );

        const optional =
          (requiredProp &&
            requiredProp.isKind(SyntaxKind.PropertyAssignment) &&
            requiredProp.getInitializer()?.getText() === "false") ||
          !requiredProp;

        // enum sin type
        const enumProp = objProps.find(
          (p) =>
            p.isKind(SyntaxKind.PropertyAssignment) && p.getName() === "enum"
        );
        const typeProp = objProps.find(
          (p) =>
            p.isKind(SyntaxKind.PropertyAssignment) && p.getName() === "type"
        );

        if (enumProp && enumProp.isKind(SyntaxKind.PropertyAssignment)) {
          const enumInit = enumProp.getInitializerIfKind(
            SyntaxKind.ArrayLiteralExpression
          );
          if (enumInit) {
            const values = enumInit.getElements().map((e) => e.getText());
            type = values.join(" | ");
          }
        } else if (typeProp && typeProp.isKind(SyntaxKind.PropertyAssignment)) {
          const typeInit = typeProp.getInitializer();
          if (typeInit?.isKind(SyntaxKind.Identifier)) {
            if (typeInit.getText() === "Map") {
              const ofProp = objProps.find(
                (p) =>
                  p.isKind(SyntaxKind.PropertyAssignment) &&
                  p.getName() === "of"
              );
              let inner = "any";
              if (ofProp?.isKind(SyntaxKind.PropertyAssignment)) {
                const ofInit = ofProp.getInitializer();
                if (ofInit?.isKind(SyntaxKind.Identifier)) {
                  inner = normalizeType(ofInit.getText());
                }
              }
              type = `Record<string, ${inner}>`;
            } else {
              type = normalizeType(typeInit.getText());
            }
          } else if (typeInit?.isKind(SyntaxKind.PropertyAccessExpression)) {
            // Para casos como Schema.Types.ObjectId
            if (typeInit.getText().endsWith("ObjectId")) {
              type = "Types.ObjectId";
            } else {
              type = typeInit.getText();
            }
          } else if (typeInit?.isKind(SyntaxKind.ArrayLiteralExpression)) {
            // Para casos como type: [String]
            const arrElements = typeInit.getElements();
            if (
              arrElements.length > 0 &&
              arrElements[0].isKind(SyntaxKind.Identifier)
            ) {
              type = normalizeType(arrElements[0].getText()) + "[]";
            } else {
              type = "any[]";
            }
          }
        } else {
          // caso anidado: { futbol: { type: Boolean, ... }, ... }
          const fields = objProps
            .filter((p) => p.isKind(SyntaxKind.PropertyAssignment))
            .map((p) => {
              const key = p.getName();
              const val = p.getInitializer();
              let valType = "any";
              if (val?.isKind(SyntaxKind.Identifier)) {
                valType = normalizeType(val.getText());
              } else if (val?.isKind(SyntaxKind.ObjectLiteralExpression)) {
                const typeProp = val.getProperty("type");
                if (
                  typeProp &&
                  typeProp.isKind(SyntaxKind.PropertyAssignment)
                ) {
                  const typeInit = typeProp.getInitializer();
                  if (typeInit?.isKind(SyntaxKind.Identifier)) {
                    valType = normalizeType(typeInit.getText());
                  } else if (
                    typeInit?.isKind(SyntaxKind.PropertyAccessExpression)
                  ) {
                    if (typeInit.getText().endsWith("ObjectId")) {
                      valType = "Types.ObjectId";
                    } else {
                      valType = typeInit.getText();
                    }
                  } else if (
                    typeInit?.isKind(SyntaxKind.ArrayLiteralExpression)
                  ) {
                    const arrElements = typeInit.getElements();
                    if (
                      arrElements.length > 0 &&
                      arrElements[0].isKind(SyntaxKind.Identifier)
                    ) {
                      valType = normalizeType(arrElements[0].getText()) + "[]";
                    } else {
                      valType = "any[]";
                    }
                  }
                }
              }
              return `${key}: ${valType}`;
            });
          type = `{ ${fields.join("; ")} }`;
        }

        return [{ name, type, optional }];
      }

      // 🔸 Caso arreglo
      // ej: comments: [{ body: String, date: Date }]
      // o: comments: String[]
      else if (initializer.isKind(SyntaxKind.ArrayLiteralExpression)) {
        const elements = initializer.getElements();
        if (elements.length > 0) {
          const first = elements[0];

          if (first.isKind(SyntaxKind.ObjectLiteralExpression)) {
            const fields = first.getProperties().map((p) => {
              if (!p.isKind(SyntaxKind.PropertyAssignment)) return "";
              const key = p.getName();
              const val = p.getInitializer();
              const valType = val?.isKind(SyntaxKind.Identifier)
                ? normalizeType(val.getText())
                : "any";
              return `${key}: ${valType}`;
            });
            type = `{ ${fields.join("; ")} }[]`;
          } else if (first.isKind(SyntaxKind.Identifier)) {
            type = normalizeType(first.getText()) + "[]";
          } else {
            type = first.getText() + "[]";
          }
        } else {
          type = "any[]";
        }
      }

      // fallback: cualquier cosa que no calce
      else {
        type = initializer.getText();
      }

      return [{ name, type, optional: false }];
    });
  }

  return parsedFields;
}
