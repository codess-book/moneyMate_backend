
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_ACCOUNT_SID_DEV, process.env.TWILIO_AUTH_TOKEN_DEV);
const FROM = "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER_DEV;
// console.log(client);
console.log(FROM);

exports.sendWhatsAppMessage = async (to, message) => {

  console.log("ayaa",message);
  try {
    await client.messages.create({
      from: FROM,  // using FROM from env
      to: `whatsapp: ${to}`,  // example: +91XXXXXXXXXX
      body: message,
    });
    console.log("✅ WhatsApp sent to", to);
  } catch (error) {
    console.error("❌ WhatsApp send failed:", error.message);
  }
};


