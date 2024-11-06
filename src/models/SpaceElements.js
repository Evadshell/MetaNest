// src/lib/User.js
import mongoose from "mongoose";

const SpaceElementsSchema = new mongoose.Schema({
    id: { type: String , unique: true},
    elementId: { type: String },
    spaceId: { type: String },
    x: { type: Number },
    y: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.SpaceElements || mongoose.model("SpaceElements", SpaceElementsSchema);
