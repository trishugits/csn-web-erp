const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entries.userModel' },
  userModel: { type: String, enum: ['Student','Teacher'], required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  remarks: { type: String, default: '' }
}, { _id: false });

const dailySchema = new mongoose.Schema({
  date: { type: Date, required: true },                 
  class: { type: String, default: null },               
  role: { type: String, enum: ['student','teacher'], required: true },
  isSchoolClosed: { type: Boolean, default: false },
  entries: { type: [entrySchema], default: [] },        
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

dailySchema.index({ date: 1, class: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('DailyAttendance', dailySchema);
