const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Renter', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  tenantCycle: { type: Number, default: 1 },
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  prevReading: { type: Number, default: 0 },
  currReading: { type: Number, default: 0 },
  unitsConsumed: { type: Number, default: 0 },
  ratePerUnit: { type: Number, default: 0 },
  electricityBill: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  advanceUsed: { type: Number, default: 0 },
  advanceAdded: { type: Number, default: 0 },
  remainingAdvance: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Pending', 'Under Review', 'Partial'], default: 'Pending' },
  paymentDate: { type: Date },
  notes: { type: String },
  screenshotUrl: { type: String },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
}, { timestamps: true });

// Prevent duplicate payment records per renter per month per cycle
paymentSchema.index({ renterId: 1, month: 1, tenantCycle: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
