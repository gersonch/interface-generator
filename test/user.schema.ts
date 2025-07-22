import { Schema, Prop } from "@nestjs/mongoose";

@Schema()
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  age?: number;
}
