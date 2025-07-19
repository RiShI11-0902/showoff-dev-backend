// models/project.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  github: String,
  demo: String,
  technologies: [String],
  createdAt: { type: Date, default: Date.now },
  votes: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }, // for project of the month
  submittedMonth: {
    type: String, // e.g., "2025-06"
    required: true,
    default: null
  },
  isCompeting: { type: Boolean, default: false },
  voters: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    month: String, // e.g., "2025-06"
  },
],
});

module.exports = mongoose.model('Project', ProjectSchema);
