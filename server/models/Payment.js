const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Renter', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  electricityBill: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Under Review'], default: 'Pending' },
  paymentDate: { type: Date },
  notes: { type: String },
  screenshotUrl: { type: String },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
}, { timestamps: true });

// Prevent duplicate payment records per renter per month
paymentSchema.index({ renterId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
