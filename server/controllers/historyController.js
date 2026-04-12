const Renter = require('../models/Renter');
const Payment = require('../models/Payment');

exports.getHistory = async (req, res) => {
  try {
    const adminId = req.adminId;
    const leftRenters = await Renter.find({ isActive: false, adminId }).sort({ leftAt: -1 });
    const paidPayments = await Payment.find({ status: 'Paid', adminId })
      .populate('renterId', 'name roomNumber phone')
      .sort({ paymentDate: -1 })
      .limit(100);
    res.json({ leftRenters, paidPayments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTenantDetails = async (req, res) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, adminId: req.adminId });
    if (!renter) return res.status(404).json({ message: 'Tenant not found' });
    const payments = await Payment.find({ renterId: req.params.id, adminId: req.adminId }).sort({ month: -1 });
    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    res.json({ renter, payments, totalPaid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
