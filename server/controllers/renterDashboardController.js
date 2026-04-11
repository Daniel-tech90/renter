const Renter = require('../models/Renter');
const Payment = require('../models/Payment');

// GET /api/renter/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const renter = await Renter.findById(req.user.id).select('-password');
    if (!renter) return res.status(404).json({ message: 'Renter not found' });

    const payments = await Payment.find({ renterId: req.user.id });

    const totalRent = renter.rentAmount;
    const paidPayments = payments.filter(p => p.status === 'Paid');
    const pendingPayments = payments.filter(p => p.status === 'Pending');
    const underReview = payments.filter(p => p.status === 'Under Review');

    const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalDue = pendingPayments.reduce((s, p) => s + p.amount, 0);

    res.json({
      renter,
      summary: {
        totalRent,
        totalPaid,
        totalDue,
        paidMonths: paidPayments.length,
        pendingMonths: pendingPayments.length,
        underReviewMonths: underReview.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/renter/payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ renterId: req.user.id }).sort({ month: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/renter/payments/:id/receipt  — renter can only download their own
exports.downloadReceipt = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, renterId: req.user.id }).populate('renterId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'Paid') return res.status(400).json({ message: 'Receipt only available for paid payments' });

    const PDFDocument = require('pdfkit');
    const r = payment.renterId;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment._id}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 595, 100).fill('#4F46E5');
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold').text('RENT RECEIPT', 50, 30, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Ramishwar Sahu Rental Portal', 50, 62, { align: 'center' });

    doc.fillColor('#1e293b').fontSize(10).font('Helvetica')
      .text(`Receipt ID : ${payment._id}`, 50, 120)
      .text(`Generated  : ${new Date().toDateString()}`, 50, 136);

    doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#e2e8f0').lineWidth(1).stroke();

    doc.fillColor('#4F46E5').fontSize(13).font('Helvetica-Bold').text('TENANT DETAILS', 50, 172);
    const tenantDetails = [
      ['Full Name', r.name], ['Phone', r.phone],
      ['Room Number', `Room ${r.roomNumber}`],
      ['Monthly Rent', `₹${r.rentAmount.toLocaleString()}`],
    ];
    let y = 195;
    tenantDetails.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(value, 220, y);
      y += 20;
    });

    doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#4F46E5').fontSize(13).font('Helvetica-Bold').text('PAYMENT DETAILS', 50, y + 24);

    const paymentDetails = [
      ['Month', payment.month],
      ['Amount Paid', `₹${payment.amount.toLocaleString()}`],
      ['Status', payment.status],
      ['Payment Date', payment.paymentDate ? new Date(payment.paymentDate).toDateString() : 'N/A'],
    ];
    y = y + 47;
    paymentDetails.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor(label === 'Status' ? '#16a34a' : '#1e293b').fontSize(10).font('Helvetica-Bold').text(value, 220, y);
      y += 20;
    });

    y += 15;
    doc.rect(50, y, 495, 55).fill('#f0fdf4').stroke('#bbf7d0');
    doc.fillColor('#15803d').fontSize(14).font('Helvetica-Bold')
      .text(`Total Amount Paid: ₹${payment.amount.toLocaleString()}`, 50, y + 18, { align: 'center', width: 495 });

    doc.rect(0, 750, 595, 92).fill('#f8fafc');
    doc.moveTo(0, 750).lineTo(595, 750).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
      .text('This is a computer-generated receipt.', 50, 762, { align: 'center', width: 495 })
      .text('Ramishwar Sahu Rental Portal  |  ramishwarsahu9@gmail.com', 50, 778, { align: 'center', width: 495 });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
