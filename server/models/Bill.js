const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  renterId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Renter', required: true },
  adminId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  month:             { type: String, required: true },
  prevReading:       { type: Number, required: true },
  currReading:       { type: Number, required: true },
  unitsConsumed:     { type: Number, required: true },
  costPerUnit:       { type: Number, required: true },
  electricityBill:   { type: Number, required: true },
  monthlyRent:       { type: Number, required: true },
  additionalCharges: { type: Number, default: 0 },
  additionalNote:    { type: String },
  totalAmount:       { type: Number, required: true },
  dueDate:           { type: String, required: true },
  status:            { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  paidAt:            { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
