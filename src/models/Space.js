// src/lib/User.js
import mongoose from "mongoose";

const SpaceSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String },
    width: { type: Number },
    height: { type: Number },
    thumbnail: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.Space || mongoose.model("Space", SpaceSchema);
