## Interface Generator CLI

Generate TypeScript interfaces from model or schema files (currently supports mongoose Schemas).

**Disclaimer:**
This tool is currently under development. Features and output may change. Please review generated interfaces before using them in production.

### Installation

Install the CLI globally:

```bash
npm install -g @negors/interface-generator
```

To get the latest (possibly unstable) version:

```bash
npm install -g @negors/interface-generator@latest
```

### Usage

Run the main command from any path:

```bash
genInt from <path/to/schema.js> -o <path/to/output/interface.ts>
```

#### Example

```bash
genInt from test/user.schema.ts -o test/user.interface.ts
```

### Options

- `from <filePath>`: Path to the schema/model file.
- `-o, --output <output>`: Path to the output file for the generated interface.

### Supports

- Mongoose schemas (including basic types, arrays, enums, nested objects, Map, Mixed, ObjectId, etc.)

### Example supported schema

```typescript
export const UserSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number },
  tags: [String],
  meta: {
    votes: Number,
    favs: Number,
  },
  ratingsByCategory: { type: Map, of: Number },
  metadata: { type: Schema.Types.Mixed },
  owner: { type: Schema.Types.ObjectId, ref: "User" },
});
```

### Generated output

```typescript
export interface IUser {
  name: string;
  age?: number;
  tags: string[];
  meta: { votes: number; favs: number };
  ratingsByCategory: Record<string, number>;
  metadata: any;
  owner: Types.ObjectId;
}
```

---

For questions or suggestions, open an issue in the repository.
