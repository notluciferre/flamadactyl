import mongoose from 'mongoose';

const CommandSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['start', 'stop', 'restart', 'status'],
  },
  botUsername: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'failed'],
  },
  result: {
    type: String,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Command || mongoose.model('Command', CommandSchema);
