const Payment = require('../models/Payment');
const Renter = require('../models/Renter');
const { sendWhatsApp } = require('../services/whatsappService');
const PDFDocument = require('pdfkit');

exports.getByRenter = async (req, res) => {
  try {
    const payments = await Payment.find({ renterId: req.params.renterId })
      .populate('renterId', 'name roomNumber phone')
      .sort({ month: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, month } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = month;
    const payments = await Payment.find(filter)
      .populate('renterId', 'name roomNumber phone')
      .sort({ month: -1, createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    await payment.populate('renterId', 'name roomNumber phone');

    if (payment.status === 'Paid') {
      await sendWhatsApp(
        payment.renterId.phone,
        `✅ Rent Confirmed!\nDear ${payment.renterId.name}, your rent of ₹${payment.amount} for ${payment.month} has been received. Thank you!`
      );
    }
    res.status(201).json(payment);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'Payment record already exists for this month' });
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('renterId', 'name roomNumber phone');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (req.body.status === 'Paid') {
      await sendWhatsApp(
        payment.renterId.phone,
        `✅ Rent Confirmed!\nDear ${payment.renterId.name}, your rent of ₹${payment.amount} for ${payment.month} has been received. Thank you!`
      );
    }
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment._id}.pdf`);
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('RENT RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text(`Receipt No: ${payment._id}`);
    doc.text(`Date: ${payment.paymentDate ? new Date(payment.paymentDate).toDateString() : new Date().toDateString()}`);
    doc.moveDown();
    doc.text(`Tenant Name: ${payment.renterId.name}`);
    doc.text(`Room Number: ${payment.renterId.roomNumber}`);
    doc.text(`Phone: ${payment.renterId.phone}`);
    doc.moveDown();
    doc.text(`Month: ${payment.month}`);
    doc.text(`Amount Paid: ₹${payment.amount}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown();
    doc.fontSize(10).fillColor('gray').text('Thank you for your payment!', { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
