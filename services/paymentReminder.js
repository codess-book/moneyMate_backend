const cron = require("node-cron");
const Customer = require("../models/Customer");
// const { sendWhatsAppMessage } = require("../services/whatsapp.service");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const startPaymentReminderCron = () => {
  //  Subah 9 baje (India time)
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log(" Running Payment Reminder Cron");

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const customers = await Customer.find({
        remainingAmount: { $gt: 0 },
        nextPaymentDate: { $gte: start, $lte: end },
      });

      for (const customer of customers) {
        //  Already reminder sent today?
        if (
          customer.lastReminderSentAt &&
          customer.lastReminderSentAt >= start
        ) {
          continue;
        }

        const message = `📢 Dear ${customer.name}, your payment of ₹${customer.remainingAmount} is pending. Please pay soon.

प्रिय ${customer.name}, आपका ₹${customer.remainingAmount} का भुगतान अभी बाकी है। कृपया जल्द भुगतान करें।

🙏 धन्यवाद!`;

        // Customer
        await sendWhatsAppMessage(`+91${customer.phone}`, message);

        // Owner
        await sendWhatsAppMessage(
          process.env.OWNER_PHONE,
          `📬 Reminder sent to ${customer.name} (${customer.phone}) | Due ₹${customer.remainingAmount}`
        );

        // ✅ Mark reminder sent
        customer.lastReminderSentAt = new Date();
        await customer.save();
      }

      console.log(
        `✅ Reminder cron completed. Sent to ${customers.length} customers`
      );
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};

module.exports = startPaymentReminderCron;
