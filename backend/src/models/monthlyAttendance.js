
const mongoose = require('mongoose');

const dayRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, enum: ['present','absent','late','excused','holiday'], required: true },
  remarks: { type: String, default: '' }
}, { _id: false });

const monthlySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userModel' },
  userModel: { type: String, enum: ['Student','Teacher'], required: true },
  role: { type: String, enum: ['student','teacher'], required: true },
  class: { type: String, default: null },
  month: { type: String, required: true }, // format YYYY-MM
  records: { type: [dayRecordSchema], default: [] },
  totalPresent: { type: Number, default:0 },
  totalAbsent: { type: Number, default:0 },
  totalLate: { type: Number, default:0 },
  totalExcused: { type: Number, default:0 },
  totalHoliday: { type: Number, default:0 },
  totalDaysCounted: { type: Number, default:0 },
  percentage: { type: Number, default:0 },
  locked: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

monthlySchema.index({ userId: 1, month: 1 }, { unique: true });

monthlySchema.methods.recalculate = function() {
  let present=0, absent=0, late=0, excused=0, holiday=0;
  for (const r of this.records) {
    switch(r.status) {
      case 'present': present++; break;
      case 'absent': absent++; break;
      case 'late': late++; break;
      case 'excused': excused++; break;
      case 'holiday': holiday++; break;
      default: break;
    }
  }
  this.totalPresent = present;
  this.totalAbsent = absent;
  this.totalLate = late;
  this.totalExcused = excused;
  this.totalHoliday = holiday;
  const countedDays = present + absent + late + excused;
  this.totalDaysCounted = countedDays;
  this.percentage = countedDays === 0 ? 0 :
    parseFloat((((present + late) / countedDays) * 100).toFixed(2));
  this.updatedAt = new Date();
};

monthlySchema.pre('save', function(next){
  this.recalculate();
  next();
});

module.exports = mongoose.model('MonthlyAttendance', monthlySchema);
