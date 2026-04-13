const axios = require('axios');

exports.sendWhatsApp = async (phone, message, mediaUrl = null) => {
  if (!process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
    console.log('[WhatsApp SKIP] Meta API not configured. Message:', message);
    return;
  }
  try {
    const to = phone.startsWith('+91') ? phone.replace('+', '') : `91${phone}`;
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    console.log('[WhatsApp] Sent to', phone);
  } catch (err) {
    console.error('[WhatsApp ERROR]', err.response?.data || err.message);
    throw err;
  }
};
