const cron = require('node-cron');
const Renter = require('../models/Renter');
const Payment = require('../models/Payment');
const { sendWhatsApp } = require('./whatsappService');

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const ensureMonthlyPayments = async () => {
  const month = getCurrentMonth();
  const renters = await Renter.find({ isActive: true });

  for (const renter of renters) {
    await Payment.findOneAndUpdate(
      { renterId: renter._id, month },
      { $setOnInsert: { renterId: renter._id, month, amount: renter.rentAmount, status: 'Pending' } },
      { upsert: true, new: true }
    );
  }
  console.log(`[Cron] Ensured payment records for ${renters.length} renters - ${month}`);
};

const sendDueReminders = async () => {
  const today = new Date().getDate();
  const month = getCurrentMonth();

  const pendingPayments = await Payment.find({ month, status: 'Pending' }).populate('renterId');

  for (const payment of pendingPayments) {
    const renter = payment.renterId;
    if (!renter || !renter.isActive) continue;

    const isDueToday = renter.dueDate === today;
    const isOverdue = renter.dueDate < today;

    if (isDueToday || isOverdue) {
      const msg = isDueToday
        ? `⏰ Rent Due Today!\nDear ${renter.name}, your rent of ₹${payment.amount} for ${month} is due today. Please pay at your earliest convenience.`
        : `🔴 Rent Overdue!\nDear ${renter.name}, your rent of ₹${payment.amount} for ${month} is overdue since the ${renter.dueDate}th. Please pay immediately.`;

      await sendWhatsApp(renter.phone, msg);
    }
  }
  console.log(`[Cron] Sent reminders for ${pendingPayments.length} pending payments`);
};

exports.startCronJobs = () => {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily payment check...');
    await ensureMonthlyPayments();
    await sendDueReminders();
  });

  // Run on 1st of every month at midnight to create new payment records
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Creating monthly payment records...');
    await ensureMonthlyPayments();
  });

  console.log('[Cron] Jobs scheduled');
};

exports.ensureMonthlyPayments = ensureMonthlyPayments;
