// models/Space.js
import mongoose from "mongoose";

const SpaceSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: { type: String },
    width: { type: Number },
    height: { type: Number },
    thumbnail: { type: String },
    author: { 
        type: String,
        required: true
    },
    // New fields
    accessCode: { 
        type: String, 
        required: true,
        unique: true 
    },
    members: [{
        userId: String,
        email: String,
        name: String,
        picture: String,
        points: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.Space || mongoose.model("Space", SpaceSchema);
