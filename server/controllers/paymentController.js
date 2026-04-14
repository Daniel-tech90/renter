const Payment = require('../models/Payment');
const Renter = require('../models/Renter');
const { sendWhatsApp } = require('../services/whatsappService');
const { stopReminders } = require('../services/cronService');

const fmtDateTime = (d = new Date()) => {
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date} ${time}`;
};
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

exports.getYearlySummary = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const allMonths = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const payments = await Payment.find({ adminId: req.adminId, month: { $regex: `^${year}-` } })
      .populate('renterId', 'name roomNumber phone rentAmount');

    const grouped = {};
    payments.forEach((p) => {
      const id = p.renterId?._id?.toString();
      if (!id) return;
      if (!grouped[id]) grouped[id] = { renter: p.renterId, payments: [] };
      grouped[id].payments.push(p);
    });

    const summary = Object.values(grouped).map(({ renter, payments }) => {
      const paidMonths = payments.filter(p => p.status === 'Paid').map(p => p.month);
      const pendingMonths = allMonths.filter(m => !paidMonths.includes(m));
      const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.totalAmount || p.amount), 0);
      return {
        renter,
        monthsPaid: paidMonths.length,
        monthsPending: pendingMonths.length,
        totalPaid,
        pendingMonths,
      };
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLastReading = async (req, res) => {
  try {
    const last = await Payment.findOne(
      { renterId: req.params.renterId, adminId: req.adminId, currReading: { $gt: 0 } },
      { currReading: 1, month: 1 }
    ).sort({ month: -1 });
    res.json({ prevReading: last ? last.currReading : 0, month: last?.month || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getByRenter = async (req, res) => {
  try {
    const payments = await Payment.find({ renterId: req.params.renterId, adminId: req.adminId })
      .populate('renterId', 'name roomNumber phone')
      .sort({ month: 1 });

    if (payments.length === 0) return res.json([]);

    const firstMonth = payments[0].month;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Use whichever is later: current month or last payment month
    const lastPaymentMonth = payments[payments.length - 1].month;
    const lastMonth = lastPaymentMonth > currentMonth ? lastPaymentMonth : currentMonth;

    const allMonths = [];
    let [y, m] = firstMonth.split('-').map(Number);
    const [ey, em] = lastMonth.split('-').map(Number);
    while (y < ey || (y === ey && m <= em)) {
      allMonths.push(`${y}-${String(m).padStart(2, '0')}`);
      m++; if (m > 12) { m = 1; y++; }
    }

    const paymentMap = {};
    payments.forEach(p => { paymentMap[p.month] = p; });

    const result = allMonths.map(month =>
      paymentMap[month] || {
        _id: `closed-${month}`,
        month,
        amount: 0,
        electricityBill: 0,
        unitsConsumed: 0,
        totalAmount: 0,
        status: 'Room Closed',
        paymentDate: null,
        renterId: payments[0].renterId,
      }
    ).reverse();

    res.json(result);
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
    const { amount, prevReading = 0, currReading = 0, ratePerUnit = 0, isAdvance = false, advanceAmount = 0 } = req.body;
    const unitsConsumed = Math.max(0, Number(currReading) - Number(prevReading));
    const electricityBill = unitsConsumed * Number(ratePerUnit);
    const totalAmount = Number(amount) + electricityBill;

    // Get renter for tenantCycle and advanceBalance
    const renter = await Renter.findById(req.body.renterId);
    const tenantCycle = renter?.tenantCycle || 1;
    let advanceBalance = renter?.advanceBalance || 0;

    let advanceUsed = 0;
    let advanceAdded = 0;
    let amountPaid = 0;
    let status = req.body.status || 'Pending';

    if (isAdvance && Number(advanceAmount) > 0) {
      advanceAdded = Number(advanceAmount);
      advanceBalance += advanceAdded;
      await Renter.findByIdAndUpdate(req.body.renterId, { advanceBalance });
      amountPaid = 0;
      status = 'Pending';
    } else {
      if (advanceBalance >= totalAmount) {
        advanceUsed = totalAmount;
        advanceBalance -= totalAmount;
        amountPaid = 0;
        status = 'Paid';
      } else if (advanceBalance > 0) {
        advanceUsed = advanceBalance;
        amountPaid = totalAmount - advanceBalance;
        advanceBalance = 0;
        status = status === 'Paid' ? 'Paid' : 'Partial';
      } else {
        amountPaid = totalAmount;
      }
      await Renter.findByIdAndUpdate(req.body.renterId, { advanceBalance });
    }

    // Auto-set paymentDate and paymentTime if fully covered by advance
    const now = new Date();
    const paymentDate = (status === 'Paid' && !req.body.paymentDate) ? now : req.body.paymentDate || null;
    const paymentTime = (status === 'Paid') ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;

    const payment = await Payment.create({
      ...req.body,
      unitsConsumed, electricityBill, totalAmount,
      tenantCycle, advanceUsed, advanceAdded,
      remainingAdvance: advanceBalance,
      amountPaid, status,
      paymentDate,
      paymentTime,
      adminId: req.adminId,
    });
    await payment.populate('renterId', 'name roomNumber phone advanceBalance');

    if (payment.status === 'Paid') {
      await sendWhatsApp(
        payment.renterId.phone,
        `✅ Payment Confirmed!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* has been received.\n\n📋 *Details:*\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nThank you! 🙏\n- Ramesh Rental Portal`
      );
    }
    res.status(201).json({ payment, advanceBalance });
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
    const now = new Date();
    const paymentTime = req.body.status === 'Paid'
      ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : undefined;
    await Payment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, unitsConsumed, electricityBill, totalAmount, ...(paymentTime && { paymentTime }) },
      { new: true, runValidators: true }
    );
    // Fetch fresh with populate to ensure phone is available
    const payment = await Payment.findById(req.params.id).populate('renterId', 'name roomNumber phone');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Stop auto reminders if paid
    if (payment.status === 'Paid') await stopReminders(payment._id);

    // Validate phone number
    const phone = payment.renterId?.phone;
    if (!phone) {
      console.warn('[WhatsApp SKIP] Tenant phone number not found for:', payment.renterId?.name);
      return res.json({ payment, whatsapp: 'skipped', reason: 'Tenant WhatsApp number not found' });
    }

    const statusChanged = prev.status !== payment.status;
    let whatsappSent = false;
    let whatsappError = null;

    try {
      let msg;
      if (payment.status === 'Paid') {
        msg = `✅ Payment Confirmed!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* has been confirmed.\n\n📋 *Details:*\n• Room: ${payment.renterId.roomNumber}\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n• Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : 'N/A'}\n\nThank you! 🙏\n- Ramesh Rental Portal`;
      } else if (payment.status === 'Pending') {
        msg = `⏰ Payment Pending!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* is marked as Pending.\n\n📋 *Details:*\n• Room: ${payment.renterId.roomNumber}\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total Due: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nPlease pay at your earliest convenience.\n- Ramesh Rental Portal`;
      } else if (payment.status === 'Partial') {
        msg = `💳 Partial Payment Received!\n\nDear ${payment.renterId.name},\nA partial payment for *${payment.month}* has been recorded.\n\n📋 *Details:*\n• Room: ${payment.renterId.roomNumber}\n• Total Due: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n• Amount Paid: ₹${(payment.amountPaid || 0).toLocaleString('en-IN')}\n• Remaining: ₹${((payment.totalAmount || payment.amount) - (payment.amountPaid || 0)).toLocaleString('en-IN')}\n\nPlease clear the remaining balance.\n- Ramesh Rental Portal`;
      } else {
        msg = `📊 Payment Updated!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* has been updated.\n\n📋 *Details:*\n• Room: ${payment.renterId.roomNumber}\n• Total: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n• Status: ${payment.status}\n\n- Ramesh Rental Portal`;
      }
      await sendWhatsApp(phone, msg);
      whatsappSent = true;
      console.log('[WhatsApp] Sent to', phone, '| Status:', payment.status, '| Tenant:', payment.renterId.name);
    } catch (waErr) {
      whatsappError = waErr.message;
      console.error('[WhatsApp ERROR]', waErr.message);
    }

    res.json({
      payment,
      whatsapp: whatsappSent ? 'sent' : whatsappError ? 'failed' : 'skipped',
      whatsappError: whatsappError || undefined,
    });
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
      `✅ Payment Approved!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* has been verified.\n\n📋 *Details:*\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nThank you! 🙏\n- Ramesh Rental Portal`
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
      `❌ Payment Screenshot Rejected!\n\nDear ${payment.renterId.name},\nYour payment screenshot for ₹${payment.amount} (${payment.month}) could not be verified.\n\nPlease submit a clear screenshot of your payment.\n\n- Ramesh`
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
      message = `⏰ Payment Reminder!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* is still pending.\n\n📋 *Details:*\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total Due: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nPlease pay at your earliest convenience.\n- Ramesh Rental Portal`;
    } else {
      message = `✅ Payment Confirmed!\n\nDear ${payment.renterId.name},\nYour payment for *${payment.month}* has been received.\n\n📋 *Details:*\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nThank you! 🙏\n- Ramesh Rental Portal`;
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
    // Get current advance balance from renter
    const renterData = await Renter.findById(r._id).select('advanceBalance');
    payment.renterId.advanceBalance = renterData?.advanceBalance || 0;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${payment._id}.pdf`);
    doc.pipe(res);

    const INR = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
    const div = (y) => doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Header
    doc.rect(0, 0, 595, 100).fill('#4F46E5');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('RENT & ELECTRICITY BILL', 50, 25, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Ramesh Rental Portal', 50, 60, { align: 'center' });

    // Status badge
    const isPaid = payment.status === 'Paid';
    const statusColor = isPaid ? '#16a34a' : payment.status === 'Partial' ? '#d97706' : '#dc2626';
    const statusBg = isPaid ? '#f0fdf4' : payment.status === 'Partial' ? '#fffbeb' : '#fef2f2';
    const statusBorder = isPaid ? '#bbf7d0' : payment.status === 'Partial' ? '#fde68a' : '#fecaca';
    doc.rect(400, 112, 145, 34).fill(statusBg).stroke(statusBorder);
    doc.fillColor(statusColor).fontSize(12).font('Helvetica-Bold')
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
     ['Total Due', INR(payment.totalAmount)],
    ].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 200, y);
      y += 16;
    });

    // Advance section if applicable
    if (payment.advanceUsed > 0 || payment.advanceAdded > 0) {
      div(y + 8); y += 22;
      doc.fillColor('#2563eb').fontSize(11).font('Helvetica-Bold').text('ADVANCE ADJUSTMENT', 50, y); y += 18;
      if (payment.advanceAdded > 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Advance Added', 50, y);
        doc.fillColor('#2563eb').fontSize(9).font('Helvetica-Bold').text(INR(payment.advanceAdded), 200, y); y += 16;
      }
      if (payment.advanceUsed > 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Advance Used', 50, y);
        doc.fillColor('#16a34a').fontSize(9).font('Helvetica-Bold').text(`- ${INR(payment.advanceUsed)}`, 200, y); y += 16;
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Remaining Advance', 50, y);
        doc.fillColor('#2563eb').fontSize(9).font('Helvetica-Bold').text(INR(payment.remainingAdvance || 0), 200, y); y += 16;
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Final Payable Amount', 50, y);
        doc.fillColor(payment.amountPaid === 0 ? '#16a34a' : '#dc2626').fontSize(9).font('Helvetica-Bold')
          .text(payment.amountPaid === 0 ? '\u20b90  (Fully Covered by Advance)' : INR(payment.amountPaid), 200, y); y += 16;
      }
    }

    // Current Advance Balance Box
    const currentAdvBalance = renterData?.advanceBalance || 0;
    if (currentAdvBalance > 0 || payment.advanceUsed > 0) {
      div(y + 8); y += 16;
      doc.rect(50, y, 495, 36).fill('#eff6ff').stroke('#bfdbfe');
      doc.fillColor('#1d4ed8').fontSize(10).font('Helvetica-Bold')
        .text(`Current Advance Balance in Account: ${INR(currentAdvBalance)}`, 50, y + 11, { align: 'center', width: 495 });
      y += 44;
    }

    if (payment.paymentDate) {
      y += 4;
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Payment Date', 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(new Date(payment.paymentDate).toDateString(), 200, y); y += 16;
    }

    // Total Payable Box
    y += 12;
    const payable = payment.amountPaid !== undefined ? payment.amountPaid : payment.totalAmount;
    const fullyByAdvance = payment.advanceUsed > 0 && payable === 0;
    doc.rect(50, y, 495, 52).fill(fullyByAdvance ? '#f0fdf4' : '#EEF2FF').stroke(fullyByAdvance ? '#bbf7d0' : '#C7D2FE');
    doc.fillColor(fullyByAdvance ? '#15803d' : '#4338CA').fontSize(13).font('Helvetica-Bold')
      .text(
        fullyByAdvance
          ? `FINAL PAYABLE : \u20b90  \u2714 Fully Covered by Advance`
          : `FINAL PAYABLE : ${INR(payable)}`,
        50, y + 18, { align: 'center', width: 495 }
      );

    // Footer
    doc.rect(0, 780, 595, 62).fill('#f8fafc');
    doc.moveTo(0, 780).lineTo(595, 780).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
      .text('This is a computer-generated bill.', 50, 792, { align: 'center', width: 495 })
      .text(`Ramesh Rental Portal  |  Generated on ${new Date().toLocaleString('en-IN')}`, 50, 808, { align: 'center', width: 495 });

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
       .text('Ramesh Rental Portal', 50, 62, { align: 'center' });

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
      ['Month',            payment.month],
      ['Rent Amount',      `\u20b9${payment.amount.toLocaleString()}`],
      ['Electricity Bill', `\u20b9${(payment.electricityBill || 0).toLocaleString()}`],
      ['Total Due',        `\u20b9${payment.totalAmount.toLocaleString()}`],
      ['Advance Used',     payment.advanceUsed > 0 ? `- \u20b9${payment.advanceUsed.toLocaleString()}` : '\u2014'],
      ['Amount Paid',      `\u20b9${(payment.amountPaid || payment.amount).toLocaleString()}`],
      ['Status',           payment.status],
      ['Payment Date',     payment.paymentDate ? new Date(payment.paymentDate).toDateString() : 'N/A'],
    ];

    y = y + 47;
    paymentDetails.forEach(([label, value]) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      const isStatus = label === 'Status';
      const isAdvance = label === 'Advance Used' && payment.advanceUsed > 0;
      doc.fillColor(
        isStatus && value === 'Paid' ? '#16a34a' :
        isAdvance ? '#2563eb' :
        '#1e293b'
      ).fontSize(10).font('Helvetica-Bold').text(value, 220, y);
      y += 20;
    });

    // ── Amount Box ─────────────────────────────────────────────
    y += 15;
    doc.rect(50, y, 495, 55).fill('#f0fdf4').stroke('#bbf7d0');
    doc.fillColor('#15803d').fontSize(14).font('Helvetica-Bold')
       .text(`Total Amount: \u20b9${payment.totalAmount.toLocaleString()}`, 50, y + 10, { align: 'center', width: 495 });
    if (payment.advanceUsed > 0) {
      doc.fillColor('#2563eb').fontSize(10).font('Helvetica')
         .text(`Advance Used: \u20b9${payment.advanceUsed.toLocaleString()} | Paid: \u20b9${(payment.amountPaid || 0).toLocaleString()}`, 50, y + 30, { align: 'center', width: 495 });
    }

    // ── Current Advance Balance ─────────────────────────────────
    const renterForBalance = await Renter.findById(r._id).select('advanceBalance');
    const currentAdvBal = renterForBalance?.advanceBalance || 0;
    y += 65;
    doc.rect(50, y, 495, 36).fill('#eff6ff').stroke('#bfdbfe');
    doc.fillColor('#1d4ed8').fontSize(10).font('Helvetica-Bold')
       .text(`Current Advance Balance in Account: \u20b9${currentAdvBal.toLocaleString('en-IN')}`, 50, y + 11, { align: 'center', width: 495 });
    y += 36;

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
       .text('Ramesh Rental Portal  |  ramishwarsahu9@gmail.com', 50, 778, { align: 'center', width: 495 })
       .text(`Generated on ${new Date().toLocaleString()}`, 50, 794, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
