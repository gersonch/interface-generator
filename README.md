## Interface Generator CLI

Generate TypeScript interfaces from model or schema files (currently supports mongoose Schemas, TypeOrm entities and Sequelize models).

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

Run the main command from any path.

```bash
genInt from <path/to/schema.js> -o <path/to/output/interface.ts>
```

#### Example

```bash
genInt from test/user.schema.ts -o test/user.interface.ts
```

**Note**
After running the command, the CLI will prompt you to select which ORM or ODM you want to use (Mongoose, TypeORM, Sequelize).

### Options

- `from <filePath>`: Path to the schema/model file.
- `-o, --output <output>`: Path to the output file for the generated interface.

### Supports

- Mongoose schemas (including basic types, arrays, enums, nested objects, Map, Mixed, ObjectId, etc.)
- TypeOrm entities
- Sequelize models

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

## Contributing

If you want to contribute:

1. Clone the repository:
   ```bash
   git clone https://github.com/gersonch/interface-generator.git
   cd interface-generator
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:

   ```bash
   npm run build
   ```

4. To test the CLI locally, you can run (from the project root):

   ```bash
   node dist/cli.js from <path/to/schema.js> -o <path/to/output/interface.ts>
   ```

   Or, for development, use:

   ```bash
   npm run dev -- from <path/to/schema.js> -o <path/to/output/interface.ts>
   ```

5. To use the CLI globally (as the `genInt` command) without publishing, run:
   ```bash
   npm link
   ```
   Now you can use `genInt` from anywhere in your system.

For questions or suggestions, open an issue in the repository.
