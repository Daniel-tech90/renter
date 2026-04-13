const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const renterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String },
  phone: { type: String, required: true, trim: true },
  roomNumber: { type: String, required: true, trim: true },
  rentAmount: { type: Number, required: true },
  dueDate: { type: Number, required: true, min: 1, max: 31 },
  govtIdType: { type: String, enum: ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Driving License'] },
  govtIdNumber: { type: String, trim: true },
  govtIdDocUrl: { type: String },
  isActive: { type: Boolean, default: true },
  leftAt: { type: Date },
  tenantCycle: { type: Number, default: 1 },
  advanceBalance: { type: Number, default: 0 },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  role: { type: String, default: 'renter' },
}, { timestamps: true });

renterSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

renterSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Renter', renterSchema);
