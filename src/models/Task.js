import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  spaceId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: [{ type: String }], // Array of user IDs
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'verified'],
    default: 'pending'
  },
  points: { type: Number, default: 0 },
  completedAt: { type: Date },
  verifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.Task || mongoose.model("Task", TaskSchema);