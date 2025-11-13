const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  class: { type: String, required: true },
  session: { type: String, required: true },
  period: { type: String, required: true }, 
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ["online", "offline", "cash", "cheque"], default: "online" },
  paymentDate: { type: Date },
  status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
  receiptNumber: { type: String },
  notes: { type: String },
  dueDate: { type: Date },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("FeePayment", feePaymentSchema);
