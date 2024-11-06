import mongoose from "mongoose";

const MapElementSchema = new Schema({
    id: { type: String, required: true, unique: true },
    mapId: { type: String, required: true },
    elementId: { type: String, default: null },
    x: { type: Number, default: null },
    y: { type: Number, default: null }
});

export default mongoose.models?.MapElement || mongoose.model("MapElement", MapElementSchema);