const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Renter', required: true },
  month: { type: String, required: true }, // format: "YYYY-MM"
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  paymentDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

// Prevent duplicate payment records per renter per month
paymentSchema.index({ renterId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
