const cron = require('node-cron');
const Renter  = require('../models/Renter');
const Payment = require('../models/Payment');
const { sendWhatsApp } = require('./whatsappService');

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const fmtDateTime = (d = new Date()) => {
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date} ${time}`;
};

// ── Create pending payment records for all active renters ──────────────────
const ensureMonthlyPayments = async () => {
  const month   = getCurrentMonth();
  const renters = await Renter.find({ isActive: true });
  let created   = 0;

  for (const renter of renters) {
    const existing = await Payment.findOne({ renterId: renter._id, month });
    if (!existing) {
      await Payment.create({
        renterId: renter._id,
        adminId:  renter.adminId,
        month,
        amount:      renter.rentAmount,
        totalAmount: renter.rentAmount,
        status:      'Pending',
        tenantCycle: renter.tenantCycle || 1,
        autoReminderEnabled: true,
        reminderCount: 0,
      });
      created++;
    }
  }
  console.log(`[Cron] Monthly payments ensured for ${renters.length} renters (${created} new) - ${month}`);
};

// ── Send 3-day auto reminders for pending payments ─────────────────────────
const sendAutoReminders = async () => {
  const month = getCurrentMonth();
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log(`[Cron] Checking pending payments for reminders - ${month}`);

  const pendingPayments = await Payment.find({
    month,
    status: { $in: ['Pending', 'Partial'] },
    autoReminderEnabled: { $ne: false },
  }).populate('renterId');

  console.log(`[Cron] Found ${pendingPayments.length} pending payments`);

  for (const payment of pendingPayments) {
    const renter = payment.renterId;
    if (!renter || !renter.isActive || !renter.phone) {
      console.log(`[Cron] Skipping - renter inactive or no phone`);
      continue;
    }

    // Check if 3 days have passed since last reminder (or never sent)
    const lastReminder = payment.lastReminderDate
      ? new Date(payment.lastReminderDate.getFullYear(), payment.lastReminderDate.getMonth(), payment.lastReminderDate.getDate())
      : null;

    const daysSinceLast = lastReminder
      ? Math.floor((today - lastReminder) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLast < 3) {
      console.log(`[Cron] Skipping ${renter.name} - last reminder ${daysSinceLast} day(s) ago`);
      continue;
    }

    const dateTime = fmtDateTime(now);
    const msg = `⏰ Rent Reminder!\n\nHello ${renter.name}, this is a reminder for Room ${renter.roomNumber}.\nYour rent for *${month}* is still pending.\n\n📋 *Details:*\n• Rent: ₹${payment.amount.toLocaleString('en-IN')}\n• Electricity: ₹${(payment.electricityBill || 0).toLocaleString('en-IN')}\n• Total Due: ₹${(payment.totalAmount || payment.amount).toLocaleString('en-IN')}\n\nPlease pay soon.\n📅 Date: ${dateTime.split(' ')[0]}\n🕐 Time: ${dateTime.split(' ')[1] + ' ' + dateTime.split(' ')[2]}\n\n- Ramesh Rental Portal`;

    try {
      await sendWhatsApp(renter.phone, msg);
      await Payment.findByIdAndUpdate(payment._id, {
        lastReminderDate: now,
        $inc: { reminderCount: 1 },
      });
      console.log(`[Cron] ✅ Reminder sent to ${renter.name} (${renter.phone}) | Count: ${payment.reminderCount + 1}`);
    } catch (err) {
      console.error(`[Cron] ❌ Reminder failed for ${renter.name}:`, err.message);
    }
  }
};

// ── Stop reminders when payment is marked Paid ─────────────────────────────
exports.stopReminders = async (paymentId) => {
  await Payment.findByIdAndUpdate(paymentId, { autoReminderEnabled: false });
  console.log(`[Cron] Reminders stopped for payment ${paymentId}`);
};

exports.startCronJobs = () => {
  // Daily at 9 AM — check and send reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily reminder check...');
    await sendAutoReminders();
  });

  // 1st of every month at midnight — create new payment records
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Creating monthly payment records...');
    await ensureMonthlyPayments();
  });

  console.log('[Cron] Jobs scheduled');
};

exports.ensureMonthlyPayments = ensureMonthlyPayments;
exports.sendAutoReminders     = sendAutoReminders;
