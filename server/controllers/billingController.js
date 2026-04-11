const Bill = require('../models/Bill');
const Renter = require('../models/Renter');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const { renterId, status, month } = req.query;
    const filter = { adminId: req.adminId };
    if (renterId) filter.renterId = renterId;
    if (status)   filter.status = status;
    if (month)    filter.month = month;
    const bills = await Bill.find(filter).populate('renterId', 'name roomNumber phone email').sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, adminId: req.adminId }).populate('renterId', 'name roomNumber phone email');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { prevReading, currReading, costPerUnit, monthlyRent, additionalCharges = 0 } = req.body;
    const unitsConsumed   = currReading - prevReading;
    const electricityBill = unitsConsumed * costPerUnit;
    const totalAmount     = monthlyRent + electricityBill + Number(additionalCharges);
    const bill = await Bill.create({ ...req.body, adminId: req.adminId, unitsConsumed, electricityBill, totalAmount });
    await bill.populate('renterId', 'name roomNumber phone email');
    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { prevReading, currReading, costPerUnit, monthlyRent, additionalCharges = 0 } = req.body;
    const unitsConsumed   = currReading - prevReading;
    const electricityBill = unitsConsumed * costPerUnit;
    const totalAmount     = monthlyRent + electricityBill + Number(additionalCharges);
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, adminId: req.adminId },
      { ...req.body, unitsConsumed, electricityBill, totalAmount },
      { new: true, runValidators: true }
    ).populate('renterId', 'name roomNumber phone email');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, adminId: req.adminId },
      { status: 'Paid', paidAt: new Date() },
      { new: true }
    ).populate('renterId', 'name roomNumber phone email');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Bill.findOneAndDelete({ _id: req.params.id, adminId: req.adminId });
    res.json({ message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendWhatsApp = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('renterId');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    const r = bill.renterId;
    const { sendWhatsApp } = require('../services/whatsappService');

    // Generate PDF and save to uploads/
    const fileName = `bill-${bill._id}.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      const INR = (n) => `Rs.${Number(n).toLocaleString('en-IN')}`;
      doc.rect(0, 0, 595, 110).fill('#4F46E5');
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('RENT & ELECTRICITY BILL', 50, 28, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Ramesh Rental Portal  |  ramishwarsahu9@gmail.com', 50, 62, { align: 'center' });
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(`Receipt ID: ${bill._id}`, 50, 125)
        .text(`Month: ${bill.month}`, 50, 139)
        .text(`Due Date: ${bill.dueDate}`, 50, 153)
        .text(`Status: ${bill.status}`, 50, 167);
      const div = (y) => doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      div(183);
      let y = 195;
      doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('TENANT', 50, y); y += 18;
      [['Name', r.name], ['Phone', r.phone], ['Room', `Room ${r.roomNumber}`]].forEach(([l, v]) => {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y); y += 16;
      });
      div(y + 6); y += 18;
      doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('ELECTRICITY', 50, y); y += 18;
      [
        ['Prev Reading', `${bill.prevReading} units`], ['Curr Reading', `${bill.currReading} units`],
        ['Units Consumed', `${bill.unitsConsumed} units`], ['Cost/Unit', INR(bill.costPerUnit)],
        ['Electricity Bill', INR(bill.electricityBill)],
      ].forEach(([l, v]) => {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
        doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y); y += 16;
      });
      div(y + 6); y += 18;
      doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('BILL BREAKDOWN', 50, y); y += 18;
      [['Monthly Rent', INR(bill.monthlyRent)], ['Electricity', INR(bill.electricityBill)], ['Additional', INR(bill.additionalCharges || 0)]]
        .forEach(([l, v]) => {
          doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
          doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y); y += 16;
        });
      y += 10;
      doc.rect(50, y, 495, 46).fill('#EEF2FF').stroke('#C7D2FE');
      doc.fillColor('#4338CA').fontSize(14).font('Helvetica-Bold')
        .text(`TOTAL AMOUNT: ${INR(bill.totalAmount)}`, 50, y + 14, { align: 'center', width: 495 });
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const mediaUrl = `${serverUrl}/uploads/${fileName}`;

    const message =
`🏠 *Ramesh Rental Portal*

Dear *${r.name}*,

Your bill for *${bill.month}* is ready.

📋 *Bill Summary:*
• Room: ${r.roomNumber}
• Monthly Rent: Rs.${bill.monthlyRent.toLocaleString('en-IN')}
• Electricity (${bill.unitsConsumed} units): Rs.${bill.electricityBill.toLocaleString('en-IN')}
• Additional: Rs.${(bill.additionalCharges || 0).toLocaleString('en-IN')}

💰 *Total Amount: Rs.${bill.totalAmount.toLocaleString('en-IN')}*
📅 Due Date: ${bill.dueDate}
🔖 Status: ${bill.status}

Please make the payment before the due date.

Thank you! 🙏
- Ramishwar Sahu`;

    await sendWhatsApp(r.phone, message, mediaUrl);
    res.json({ message: 'WhatsApp message sent with PDF receipt!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateReceipt = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('renterId');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const r   = bill.renterId;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bill-${bill._id}.pdf`);
    doc.pipe(res);

    const INR = (n) => `Rs.${Number(n).toLocaleString('en-IN')}`;

    // ── Header ──────────────────────────────────────────────────
    doc.rect(0, 0, 595, 110).fill('#4F46E5');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
       .text('RENT & ELECTRICITY BILL', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
       .text('Ramesh Rental Portal', 50, 58, { align: 'center' });
    doc.fontSize(9)
       .text('ramishwarsahu9@gmail.com', 50, 76, { align: 'center' });

    // ── Receipt Meta ────────────────────────────────────────────
    const statusColor = bill.status === 'Paid' ? '#16a34a' : '#dc2626';
    doc.rect(400, 120, 145, 36).fill(bill.status === 'Paid' ? '#f0fdf4' : '#fef2f2').stroke(bill.status === 'Paid' ? '#bbf7d0' : '#fecaca');
    doc.fillColor(statusColor).fontSize(14).font('Helvetica-Bold')
       .text(bill.status === 'Paid' ? '✓  PAID' : '✗  UNPAID', 400, 131, { width: 145, align: 'center' });

    doc.fillColor('#475569').fontSize(9).font('Helvetica')
       .text(`Receipt ID : ${bill._id}`, 50, 125)
       .text(`Month      : ${bill.month}`, 50, 139)
       .text(`Generated  : ${new Date().toDateString()}`, 50, 153)
       .text(`Due Date   : ${bill.dueDate}`, 50, 167);

    // ── Divider ─────────────────────────────────────────────────
    const divider = (y) => doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    divider(185);

    // ── Owner Details ───────────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('OWNER DETAILS', 50, 195);
    let y = 215;
    [['Name', 'Ramishwar Sahu'], ['Contact', 'ramishwarsahu9@gmail.com'], ['Portal', 'Ramesh Rental Portal']].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y);
      y += 16;
    });

    divider(y + 8);

    // ── Tenant Details ──────────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('TENANT DETAILS', 50, y + 18);
    y += 38;
    [['Name', r.name], ['Phone', r.phone], ['Email', r.email || '—'], ['Room Number', `Room ${r.roomNumber}`]].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y);
      y += 16;
    });

    divider(y + 8);

    // ── Electricity Details ─────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('ELECTRICITY DETAILS', 50, y + 18);
    y += 38;
    [
      ['Previous Reading', `${bill.prevReading} units`],
      ['Current Reading',  `${bill.currReading} units`],
      ['Units Consumed',   `${bill.unitsConsumed} units`],
      ['Cost per Unit',    INR(bill.costPerUnit)],
      ['Electricity Bill', INR(bill.electricityBill)],
    ].forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y);
      y += 16;
    });

    divider(y + 8);

    // ── Bill Breakdown ──────────────────────────────────────────
    doc.fillColor('#4F46E5').fontSize(11).font('Helvetica-Bold').text('BILL BREAKDOWN', 50, y + 18);
    y += 38;

    const rows = [
      ['Monthly Rent',        INR(bill.monthlyRent)],
      ['Electricity Charges', INR(bill.electricityBill)],
      ['Additional Charges',  INR(bill.additionalCharges)],
    ];
    if (bill.additionalNote) rows.push(['Additional Note', bill.additionalNote]);

    rows.forEach(([l, v]) => {
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(l, 50, y);
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(v, 180, y);
      y += 16;
    });

    // ── Total Box ───────────────────────────────────────────────
    y += 10;
    doc.rect(50, y, 495, 48).fill('#EEF2FF').stroke('#C7D2FE');
    doc.fillColor('#4338CA').fontSize(15).font('Helvetica-Bold')
       .text(`TOTAL AMOUNT : ${INR(bill.totalAmount)}`, 50, y + 15, { align: 'center', width: 495 });

    // ── Paid On ─────────────────────────────────────────────────
    if (bill.status === 'Paid' && bill.paidAt) {
      y += 60;
      doc.fillColor('#16a34a').fontSize(10).font('Helvetica-Bold')
         .text(`Payment received on: ${new Date(bill.paidAt).toDateString()}`, 50, y, { align: 'center', width: 495 });
    }

    // ── Footer ──────────────────────────────────────────────────
    doc.rect(0, 780, 595, 62).fill('#f8fafc');
    doc.moveTo(0, 780).lineTo(595, 780).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
       .text('This is a computer-generated bill. For queries contact: ramishwarsahu9@gmail.com', 50, 792, { align: 'center', width: 495 })
       .text(`Ramesh Rental Portal  |  Generated on ${new Date().toLocaleString('en-IN')}`, 50, 808, { align: 'center', width: 495 });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
