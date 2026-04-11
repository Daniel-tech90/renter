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
