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

exports.getRoomHistory = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { month, year } = req.query;
    const adminId = req.adminId;

    // All tenants for this room (active + left)
    const allTenants = await Renter.find({ roomNumber, adminId }).sort({ createdAt: 1 });
    const activeTenant = allTenants.find(r => r.isActive) || null;
    const pastTenants = allTenants.filter(r => !r.isActive);

    // Payments for selected month/year
    let paymentFilter = { adminId };
    if (month && year) paymentFilter.month = `${year}-${String(month).padStart(2, '0')}`;

    // Get payments for all tenants in this room
    const tenantIds = allTenants.map(r => r._id);
    const payments = await Payment.find({ ...paymentFilter, renterId: { $in: tenantIds } })
      .populate('renterId', 'name roomNumber tenantCycle')
      .sort({ month: -1 });

    // Build past tenant summaries
    const pastTenantSummaries = await Promise.all(pastTenants.map(async (t) => {
      const tPayments = await Payment.find({ renterId: t._id, adminId });
      const totalPaid = tPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.totalAmount || p.amount), 0);
      const joinDate = t.createdAt;
      const leftDate = t.leftAt;
      const months = leftDate ? Math.round((new Date(leftDate) - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 30)) : null;
      return { ...t.toObject(), totalPaid, totalMonths: months };
    }));

    res.json({ activeTenant, pastTenants: pastTenantSummaries, payments });
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
