const Renter = require('../models/Renter');
const Payment = require('../models/Payment');

exports.getStats = async (req, res) => {
  try {
    const adminId = req.adminId;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [totalRenters, payments, monthlyPayments] = await Promise.all([
      Renter.countDocuments({ isActive: true, adminId }),
      Payment.find({ month: currentMonth, adminId }).populate('renterId', 'name roomNumber'),
      Payment.aggregate([
        { $match: { status: 'Paid', adminId: require('mongoose').Types.ObjectId.createFromHexString(adminId.toString()) } },
        { $group: { _id: '$month', totalIncome: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const paid    = payments.filter((p) => p.status === 'Paid');
    const pending = payments.filter((p) => p.status === 'Pending');

    res.json({
      totalRenters,
      currentMonth: {
        paid: paid.length,
        pending: pending.length,
        paidAmount: paid.reduce((s, p) => s + p.amount, 0),
        pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
        payments,
      },
      monthlyIncome: monthlyPayments.reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
