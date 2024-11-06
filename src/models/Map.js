// src/lib/User.js
import mongoose from "mongoose";

const MapSchema = new mongoose.Schema({
    id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    width: { type: Number },
    height: { type: Number },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.Map || mongoose.model("Map", MapSchema);