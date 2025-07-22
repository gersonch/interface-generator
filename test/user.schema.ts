import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // elimina espacios iniciales y finales
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    age: {
      type: Number,
      default: 18,
      min: 0,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    friends: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    profile: {
      bio: String,
      location: String,
      website: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
    versionKey: false,
  }
);

export const User = mongoose.model("User", userSchema);
