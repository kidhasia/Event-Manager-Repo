const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rsvps: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum: ['Going', 'Not Going', 'Maybe'], default: 'Maybe' } }],
  checklist: [{ item: { type: String }, completed: { type: Boolean, default: false } }],
  reminders: [{ time: { type: Date }, message: { type: String } }],
});

module.exports = mongoose.model('Event', EventSchema);