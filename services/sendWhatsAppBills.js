const cron = require("node-cron");
const Customer = require("../models/Customer");
const Payment = require("../models/payment");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const { buildWhatsAppMessage } = require("../controllers/customerController");

////purana bill

//cron.schedule("* * * * *", async () => {
//  try {
//    const customersToSend = await Customer.find({ isSent: false });

//    for (const customer of customersToSend) {
//      const todayStart = new Date();
//      todayStart.setHours(0, 0, 0, 0);
//      const todayEnd = new Date();
//      todayEnd.setHours(23, 59, 59, 999);

//      const todayPayments = await Payment.find({
//        userId: customer._id,
//        createdAt: { $gte: todayStart, $lte: todayEnd },
//        billStatus: { $ne: 'sent' },
//        items: { $exists: true, $not: { $size: 0 } }
//      }).sort({ createdAt: 1 });
//       console.log(todayPayments,"todayPayments")
//      if (todayPayments.length === 0) continue;

//      // All payments before current payment (not just before today)
//      const allPayments = await Payment.find({
//        userId: customer._id
//      }).sort({ createdAt: 1 });

//      let previousDue = 0;

//      for (const payment of todayPayments) {
//        // Calculate previous due up to this payment
//        const earlierPayments = allPayments.filter(p => p.createdAt < payment.createdAt);
//        const totalPaidBefore = earlierPayments.reduce((acc, p) => acc + p.amountPaid, 0);
//        const totalBilledBefore = earlierPayments.reduce((acc, p) => acc + p.totalAmount, 0);
//        previousDue = Math.max(0, totalBilledBefore - totalPaidBefore);
//        console.log(payment)
//        const currentDue = payment.totalAmount - payment.amountPaid;
//        const totalDue = previousDue + currentDue;

//        const message = buildWhatsAppMessage(
//          customer.name,
//          payment.items,
//          payment.totalAmount,
//          payment.amountPaid,
//          totalDue,
//          customer.nextPaymentDate,
//          payment.paymentDate,
//          previousDue
//        );

//        try {

//          console.log(message);
//          await sendWhatsAppMessage(customer.phone, message);
//          await sendWhatsAppMessage(process.env.OWNER_PHONE, message);

//          payment.billStatus = 'sent';
//          await payment.save();
//        } catch (msgErr) {
//          console.error(❌ Message failed for ${customer.name}:, msgErr.message);
//          payment.billStatus = 'failed';
//          await payment.save();
//        }
//      }

//      customer.isSent = true;
//      customer.sendTime = new Date();
//      await customer.save();
//    }

//    console.log(✅ All WhatsApp bills sent at ${new Date().toLocaleTimeString()});
//  } catch (err) {
//    console.error("❌ Error in cron WhatsApp sender:", err);
//  }
//});

//cron.schedule("* * * * *", async () => {
//cron.schedule("* 23 * * *", async () => {


// isko abhi hum bad mai use krega..

cron.schedule("0 23 * * *", async () => {
  try {
    const customersToSend = await Customer.find({ isSent: false });

    for (const customer of customersToSend) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 🧾 Get all payments for this customer (sorted by createdAt)
      const allPayments = await Payment.find({ userId: customer._id }).sort({
        createdAt: 1,
      });

      if (allPayments.length === 0) continue;

      let runningTotalBilled = 0;
      let runningTotalPaid = 0;

      for (const payment of allPayments) {
        const isTodayUnsentBill =
          payment.createdAt >= todayStart &&
          payment.createdAt <= todayEnd &&
          payment.billStatus !== "sent" &&
          payment.items &&
          payment.items.length > 0;

        const previousDue = Math.max(0, runningTotalBilled - runningTotalPaid);
        const currentDue = payment.totalAmount - payment.amountPaid;
        const totalDue = previousDue + currentDue;

        // 🛠 FIX: Only increase billed if items exist
        if (payment.items && payment.items.length > 0) {
          runningTotalBilled += payment.totalAmount;
        }

        runningTotalPaid += payment.amountPaid;

        if (isTodayUnsentBill) {
          const message = buildWhatsAppMessage(
            customer.name,
            payment.items,
            payment.totalAmount,
            payment.amountPaid,
            totalDue,
            customer.nextPaymentDate,
            payment.paymentDate,
            previousDue
          );
          console.log("bill", message);
          try {
            await sendWhatsAppMessage(customer.phone, message);
            await sendWhatsAppMessage(process.env.OWNER_PHONE, message);
            payment.billStatus = "sent";
            await payment.save();
          } catch (err) {
            //console.error(❌ Failed for ${customer.name}:, err.message);
            payment.billStatus = "failed";
            await payment.save();
          }
        }
      }

      // ✅ Mark customer as processed
      customer.isSent = true;
      customer.sendTime = new Date();
      await customer.save();
    }

    // console.log(✅ "All WhatsApp bills sent at",` ${new Date().toLocaleTimeString()`});
  } catch (err) {
    console.error("❌ Error in cron WhatsApp sender:", err);
  }
});
