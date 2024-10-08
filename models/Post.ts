import mongoose from "mongoose";
import "./User";
import { IUser } from "./User";

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String,  default: "" },
  image: { type: String } || null,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PostSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

export interface IPost {
  _id: mongoose.Types.ObjectId;
  user: IUser
  content: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.Post || mongoose.model("Post", PostSchema);