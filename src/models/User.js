// src/lib/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true },
  name: { type: String },
  email: { type: String, unique: true },
  nickname : {type:String},
  picture:{type:String},
  avartarId:{type:String},
  spaces: [{
    spaceId: String,
    role: { type: String, enum: ['leader', 'member'] },
    points: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models?.User || mongoose.model('User', UserSchema);
