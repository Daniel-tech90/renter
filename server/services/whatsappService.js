const twilio = require('twilio');

exports.sendWhatsApp = async (phone, message, mediaUrl = null) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('[WhatsApp SKIP] Twilio not configured. Message:', message);
    return;
  }
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:+91${phone}`;
    const payload = { from: process.env.TWILIO_WHATSAPP_FROM, to, body: message };
    if (mediaUrl) payload.mediaUrl = [mediaUrl];
    await client.messages.create(payload);
    console.log('[WhatsApp] Sent to', phone, mediaUrl ? '+ PDF attached' : '');
  } catch (err) {
    console.error('[WhatsApp ERROR]', err.message);
    throw err;
  }
};
