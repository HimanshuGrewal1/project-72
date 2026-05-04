import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  ownerId: String,
  name: String,
  status: { type: String, default: 'pending' },
});
export const Project = mongoose.model('Project', projectSchema);