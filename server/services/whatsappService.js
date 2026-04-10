const axios = require('axios');

// ─── Twilio ───────────────────────────────────────────────────────────────────
const sendViaTwilio = async (phone, message) => {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:+91${phone}`;
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body: message,
  });
  console.log('[WhatsApp Twilio] Sent to', phone);
};

// ─── Meta WhatsApp Business API ───────────────────────────────────────────────
const sendViaMeta = async (phone, message) => {
  const to = phone.startsWith('+') ? phone.replace('+', '') : `91${phone}`;
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  console.log('[WhatsApp Meta] Sent to', phone);
};

// ─── Main export ──────────────────────────────────────────────────────────────
exports.sendWhatsApp = async (phone, message) => {
  try {
    // Use Twilio if configured (confirmed working), else try Meta
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await sendViaTwilio(phone, message);
    } else if (process.env.META_PHONE_NUMBER_ID && process.env.META_ACCESS_TOKEN) {
      await sendViaMeta(phone, message);
    } else {
      console.log('[WhatsApp SKIP] No API configured. Message:', message);
    }
  } catch (err) {
    console.error('[WhatsApp ERROR]', err.response?.data || err.message);
  }
};
