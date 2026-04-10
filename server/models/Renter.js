const mongoose = require('mongoose');

const renterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  roomNumber: { type: String, required: true, trim: true },
  rentAmount: { type: Number, required: true },
  dueDate: { type: Number, required: true, min: 1, max: 31 }, // day of month
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Renter', renterSchema);
