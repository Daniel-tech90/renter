const Payment = require('../models/Payment');
const Renter = require('../models/Renter');
const { sendWhatsApp } = require('../services/whatsappService');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

exports.getByRenter = async (req, res) => {
  try {
    const payments = await Payment.find({ renterId: req.params.renterId, adminId: req.adminId })
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
    const filter = { adminId: req.adminId };
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
    const { amount, prevReading = 0, currReading = 0, ratePerUnit = 0 } = req.body;
    const unitsConsumed = Math.max(0, Number(currReading) - Number(prevReading));
    const electricityBill = unitsConsumed * Number(ratePerUnit);
    const totalAmount = Number(amount) + electricityBill;
    const payment = await Payment.create({ ...req.body, unitsConsumed, electricityBill, totalAmount, adminId: req.adminId });
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
    const { amount, prevReading = 0, currReading = 0, ratePerUnit = 0 } = req.body;
    const unitsConsumed = Math.max(0, Number(currReading) - Number(prevReading));
    const electricityBill = unitsConsumed * Number(ratePerUnit);
    const totalAmount = Number(amount) + electricityBill;
    const prev = await Payment.findById(req.params.id);
    const payment = await Payment.findByIdAndUpdate(req.params.id, { ...req.body, unitsConsumed, electricityBill, totalAmount }, {
      new: true, runValidators: true,
    }).populate('renterId', 'name roomNumber phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const statusChanged = prev.status !== payment.status;

    if (statusChanged && payment.status === 'Paid') {
      await sendWhatsApp(
        payment.renterId.phone,
        `✅ Rent Payment Confirmed!\n\nDear ${payment.renterId.name},\nYour rent payment of ₹${payment.amount} for ${payment.month} has been received and confirmed.\n\nThank you for your timely payment! 🙏\n\n- Ramishwar Sahu\nRental Portal`
      );
    } else if (statusChanged && payment.status === 'Pending') {
      await sendWhatsApp(
        payment.renterId.phone,
        `⏰ Rent Payment Reminder!\n\nDear ${payment.renterId.name},\nYour rent of ₹${payment.amount} for ${payment.month} is marked as Pending.\n\nPlease make the payment at your earliest convenience.\n\n- Ramishwar Sahu\nRental Portal`
      );
    }

    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Renter submits payment screenshot
exports.submitScreenshot = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId', 'name roomNumber phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (!req.file) return res.status(400).json({ message: 'Screenshot is required' });

    payment.screenshotUrl = req.file.path;
    payment.status = 'Under Review';
    payment.submittedAt = new Date();
    await payment.save();

    // Notify admin via WhatsApp
    await sendWhatsApp(
      process.env.ADMIN_PHONE,
      `📸 Payment Screenshot Received!\n\nTenant: ${payment.renterId.name}\nRoom: ${payment.renterId.roomNumber}\nAmount: ₹${payment.amount}\nMonth: ${payment.month}\n\nPlease login to portal to review and approve.`
    );

    res.json({ message: 'Screenshot submitted successfully. Awaiting approval.', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approves payment
exports.approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId', 'name roomNumber phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = 'Paid';
    payment.approvedAt = new Date();
    payment.paymentDate = new Date();
    await payment.save();

    await sendWhatsApp(
      payment.renterId.phone,
      `✅ Rent Payment Approved!\n\nDear ${payment.renterId.name},\nYour rent payment of ₹${payment.amount} for ${payment.month} has been verified and approved.\n\nThank you! 🙏\n- Ramishwar Sahu`
    );

    res.json({ message: 'Payment approved successfully', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin rejects payment
exports.rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId', 'name roomNumber phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    payment.status = 'Pending';
    payment.screenshotUrl = null;
    payment.submittedAt = null;
    await payment.save();

    await sendWhatsApp(
      payment.renterId.phone,
      `❌ Payment Screenshot Rejected!\n\nDear ${payment.renterId.name},\nYour payment screenshot for ₹${payment.amount} (${payment.month}) could not be verified.\n\nPlease submit a clear screenshot of your payment.\n\n- Ramishwar Sahu`
    );

    res.json({ message: 'Payment rejected', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send WhatsApp message manually
exports.sendMessage = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId', 'name roomNumber phone');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const { type } = req.body; // 'confirmation' or 'reminder'
    let message;

    if (type === 'reminder') {
      message = `⏰ Rent Due Reminder!\n\nDear ${payment.renterId.name},\nYour rent of ₹${payment.amount} for ${payment.month} is still pending.\n\nPlease pay at your earliest convenience.\n\n- Ramishwar Sahu\nRental Portal`;
    } else {
      message = `✅ Rent Payment Confirmed!\n\nDear ${payment.renterId.name},\nYour rent payment of ₹${payment.amount} for ${payment.month} has been received and confirmed.\n\nThank you for your timely payment! 🙏\n\n- Ramishwar Sahu\nRental Portal`;
    }

    await sendWhatsApp(payment.renterId.phone, message);
    res.json({ message: 'WhatsApp message sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateBill = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const r = payment.renterId;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${payment._id}.pdf`);
    doc.pipe(res);

    const INR = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
    const div = (y) => doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Header
    doc.rect(0, 0, 595, 100).fill('#4F46E5');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('RENT & ELECTRICITY BILL', 50, 25, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Ramishwar Sahu Rental Portal', 50, 60, { align: 'center' });

    // Status badge
    const isPaid = payment.status === 'Paid';
    doc.rect(400, 112, 145, 34).fill(isPaid ? '#f0fdf4' : '#fef2f2').stroke(isPaid ? '#bbf7d0' : '#fecaca');
    doc.fillColor(isPaid ? '#16a34a' : '#dc2626').fontSize(12).font('Helvetica-Bold')
      .text(payment.status.toUpperCase(), 400, 122, { width: 145, align: 'center' });

    // Meta
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
      .text(`Bill ID   : ${payment._id}`, 50, 115)
      .text(`Month     : ${payment.month}`, 50, 129)
      .text(`Generated : ${new Date().toDateString()}`, 50, 143);

    div(160);

    // Tenant
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('TENANT DETAILS', 50, 172);
    let y = 190;
    [['Name', r.name], ['Phone', r.phone], ['Room', `Room ${r.roomNumber}`], ['Monthly Rent', INR(r.rentAmount)]]
      .forEach(([l, v]) => {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 200, y);
        y += 16;
      });

    div(y + 8); y += 22;

    // Electricity
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('ELECTRICITY DETAILS', 50, y); y += 18;
    [['Previous Reading', `${payment.prevReading || 0} units`],
     ['Current Reading',  `${payment.currReading || 0} units`],
     ['Units Consumed',   `${payment.unitsConsumed || 0} units`],
     ['Rate per Unit',    INR(payment.ratePerUnit)],
     ['Electricity Bill', INR(payment.electricityBill)],
    ].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 200, y);
      y += 16;
    });

    div(y + 8); y += 22;

    // Bill Breakdown
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('BILL BREAKDOWN', 50, y); y += 18;
    [['Rent Amount', INR(payment.amount)],
     ['Electricity Bill', INR(payment.electricityBill)],
     ['Payment Date', payment.paymentDate ? new Date(payment.paymentDate).toDateString() : 'Not paid yet'],
    ].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 200, y);
      y += 16;
    });

    // Total Box
    y += 12;
    doc.rect(50, y, 495, 48).fill('#EEF2FF').stroke('#C7D2FE');
    doc.fillColor('#4338CA').fontSize(15).font('Helvetica-Bold')
      .text(`TOTAL AMOUNT : ${INR(payment.totalAmount)}`, 50, y + 15, { align: 'center', width: 495 });

    // Footer
    doc.rect(0, 780, 595, 62).fill('#f8fafc');
    doc.moveTo(0, 780).lineTo(595, 780).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
      .text('This is a computer-generated bill.', 50, 792, { align: 'center', width: 495 })
      .text(`Ramishwar Sahu Rental Portal  |  Generated on ${new Date().toLocaleString('en-IN')}`, 50, 808, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('renterId');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const r = payment.renterId;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment._id}.pdf`);
    doc.pipe(res);

    // ── Header Banner ──────────────────────────────────────────
    doc.rect(0, 0, 595, 100).fill('#4F46E5');
    doc.fillColor('white').fontSize(26).font('Helvetica-Bold')
       .text('RENT RECEIPT', 50, 30, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
       .text('Ramishwar Sahu Rental Portal', 50, 62, { align: 'center' });

    // ── Receipt Meta ───────────────────────────────────────────
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica')
       .text(`Receipt ID : ${payment._id}`, 50, 120)
       .text(`Generated  : ${new Date().toDateString()}`, 50, 136);

    // ── Divider ────────────────────────────────────────────────
    doc.moveTo(50, 158).lineTo(545, 158).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // ── Tenant Details ─────────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(13).font('Helvetica-Bold')
       .text('TENANT DETAILS', 50, 172);

    const tenantDetails = [
      ['Full Name',    r.name],
      ['Phone Number', r.phone],
      ['Room Number',  `Room ${r.roomNumber}`],
      ['Monthly Rent', `\u20b9${r.rentAmount.toLocaleString()}`],
      ['Due Date',     `${r.dueDate}th of every month`],
    ];

    let y = 195;
    tenantDetails.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(value, 220, y);
      y += 20;
    });

    // ── Divider ────────────────────────────────────────────────
    doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // ── Payment Details ────────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(13).font('Helvetica-Bold')
       .text('PAYMENT DETAILS', 50, y + 24);

    const paymentDetails = [
      ['Month',        payment.month],
      ['Amount Paid',  `\u20b9${payment.amount.toLocaleString()}`],
      ['Status',       payment.status],
      ['Payment Date', payment.paymentDate ? new Date(payment.paymentDate).toDateString() : 'N/A'],
      ['Approved On',  payment.approvedAt ? new Date(payment.approvedAt).toDateString() : 'N/A'],
    ];

    y = y + 47;
    paymentDetails.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      const isStatus = label === 'Status';
      doc.fillColor(isStatus && value === 'Paid' ? '#16a34a' : '#1e293b')
         .fontSize(10).font('Helvetica-Bold').text(value, 220, y);
      y += 20;
    });

    // ── Amount Box ─────────────────────────────────────────────
    y += 15;
    doc.rect(50, y, 495, 55).fill('#f0fdf4').stroke('#bbf7d0');
    doc.fillColor('#15803d').fontSize(14).font('Helvetica-Bold')
       .text(`Total Amount Paid: \u20b9${payment.amount.toLocaleString()}`, 50, y + 18, { align: 'center', width: 495 });

    // ── Notes ──────────────────────────────────────────────────
    if (payment.notes) {
      y += 70;
      doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('Notes:', 50, y);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(payment.notes, 50, y + 16);
    }

    // ── Footer ─────────────────────────────────────────────────
    doc.rect(0, 750, 595, 92).fill('#f8fafc');
    doc.moveTo(0, 750).lineTo(595, 750).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
       .text('This is a computer-generated receipt and does not require a signature.', 50, 762, { align: 'center', width: 495 })
       .text('Ramishwar Sahu Rental Portal  |  ramishwarsahu9@gmail.com', 50, 778, { align: 'center', width: 495 })
       .text(`Generated on ${new Date().toLocaleString()}`, 50, 794, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
