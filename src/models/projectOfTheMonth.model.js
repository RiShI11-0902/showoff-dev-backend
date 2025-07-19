const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectOfTheMonthSchema = new Schema({
  month: { type: String, required: true, unique: true }, // "2025-06"
  winnerProject: { type: Schema.Types.ObjectId, ref: 'Project' },
  selectedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectOfTheMonth', ProjectOfTheMonthSchema);
