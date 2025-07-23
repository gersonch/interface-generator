export function normalizeType(type: string): string {
  const map: Record<string, string> = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Date: "Date",
    ObjectId: "string",
  };

  // Elimina envoltorios como Promise<>, Array<>, etc.
  type = type.replace(/^Promise<(.+)>$/, "$1");
  type = type.replace(/^Array<(.+)>$/, "$1");

  // Quita import(...) y deja solo el nombre
  const importMatch = type.match(/import\(["'][^"']+["']\)\.(\w+)/);
  if (importMatch) {
    type = importMatch[1]; // Solo el nombre después del punto
  }

  // Si es tipo array, conserva los []
  const isArray = type.endsWith("[]");
  const baseType = isArray ? type.slice(0, -2) : type;

  const normalized = map[baseType] ?? baseType;
  return isArray ? `${normalized}[]` : normalized;
}
