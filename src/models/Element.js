import mongoose from "mongoose";

const ElementSchema = new mongoose.Schema({
    id: { type: String , unique: true},
    imageUrl: { type: String },
    height: { type: Number },
    width: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.Element || mongoose.model("Element", ElementSchema);
