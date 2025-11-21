const Customer = require("../models/Customer");
const Payment = require("../models/payment");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const { buildWhatsAppMessage } = require("../controllers/customerController");

//get by id// GET /api/customer/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//new payment

//partial
exports.updatePayment = async (req, res) => {
  try {
    const { customerId, amountPaid, nextPaymentDate, paymentDate } = req.body;

    console.log(req.body);
    console.log(amountPaid);
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const newPaidAmount = customer.paidAmount + amountPaid;

    // ⛔ Prevent overpayment
    if (newPaidAmount > customer.totalAmount) {
      return res.status(400).json({ message: "Payment exceeds total amount" });
    }

    customer.paidAmount = newPaidAmount;
    customer.remainingAmount = customer.totalAmount - newPaidAmount;
    customer.lastPaymentDate = paymentDate ? new Date(paymentDate) : new Date();

    if (customer.remainingAmount > 0 && nextPaymentDate) {
      customer.nextPaymentDate = nextPaymentDate;
    } else {
      customer.nextPaymentDate = null;
    }

    await customer.save();

    //     const payment = new Payment({
    //   userId: customer._id,
    //   totalAmount: customer.totalAmount,
    //   amountPaid,
    //   paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    //   nextPaymentDate: customer.nextPaymentDate,
    //   status: customer.remainingAmount === 0 ? "paid" : "due",
    //   items: [], // 🧠 Empty since it's not product order, only payment
    // });
    const payment = new Payment({
      userId: customer._id,

      // required fields (since this is not an order, it's a payment entry)
      subTotal: customer.totalAmount,
      totalGST: 0,
      grandTotal: customer.totalAmount,

      // payment tracking
      amountPaid,
      dueAmount: customer.remainingAmount,

      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      nextPaymentDate: customer.nextPaymentDate,
      status: customer.remainingAmount === 0 ? "paid" : "partial",

      items: [], // no items for payment-only entry
      billStatus: "updated",
    });

    

    await payment.save();

    // ✅ NEW LOGIC: Calculate today's total paid from all payments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayPayments = await Payment.find({
      userId: customer._id,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const totalPaidToday = todayPayments.reduce(
      (acc, p) => acc + p.amountPaid,
      0
    );

    //nya hai
    const oldPayments = await Payment.find({
      userId: customer._id,
      createdAt: { $lt: payment.createdAt },
      //items: { $exists: true, $not: { $size: 0 } } // ✅ Only consider "orders"
    });

    //console.log(oldPayments,"oldpayments")

    //const previousDue = oldPayments.reduce(
    //  (acc, p) => acc + (p.totalAmount - p.amountPaid),
    //  0
    //);

    const check = oldPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const previousDue = customer.totalAmount - check;
    //ye checking k liya hai
    //console.log(customer.totalAmount,"ct")
    //console.log("shi value",customer.totalAmount-check)
    console.log(`💳 पिछला बकाया: ₹${previousDue}\n`);
    console.log(`💰 आज का कुल भुगतान: ₹${amountPaid}\n`);
    console.log(`📌 कुल बकाया: ₹${customer.remainingAmount}\n\n`);

    // ✅ Build separate message for updatePayment
    const message =
      `🧾 * भुगतान अपडेट*\n\n` +
      `नमस्ते ${customer.name}, आपका भुगतान सफलतापूर्वक अपडेट किया गया है।\n\n` +
      // previousDue
      `💳 पिछला बकाया: ₹${previousDue}\n` + //purana hai
      `💰 आज का कुल भुगतान: ₹${amountPaid}\n` +
      `📌 कुल बकाया: ₹${customer.remainingAmount}\n\n` +
      //next paayment date nhi bhejna hai
      //(customer.nextPaymentDate ? `📅 अगली भुगतान तिथि: ${new Date(customer.nextPaymentDate).toLocaleDateString("hi-IN")}\n\n` : '') +
      `🙏 धन्यवाद! फिर से पधारिए 🙏`;

    await sendWhatsAppMessage(customer.phone, message);
    await sendWhatsAppMessage(process.env.OWNER_PHONE, message);

    res.status(200).json({ message: "Payment updated", customer, payment });
  } catch (err) {
    console.error("❌ Error in updatePayment:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//to get customer history
// controllers/customerController.js

exports.getCustomerWithHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // ✅ Fix: use `userId` not `customerId`
    const payments = await Payment.find({ userId: id })
      .sort({ paymentDate: 1 }) // oldest to newest
      .lean();

    // ✅ Safe totalPaid calculation from payment records
    const totalPaid = payments.length
      ? payments.reduce((sum, p) => sum + p.amountPaid, 0)
      : customer.paidAmount || 0;

    // ✅ Recalculate accurate remainingAmount — never trust DB blindly
    const remainingAmount = customer.totalAmount - totalPaid;

    // ✅ Last payment date
    const lastPaymentDate = payments.length
      ? payments[payments.length - 1].paymentDate
      : null;

    res.status(200).json({
      customer: {
        ...customer,
        totalPaid,
        remainingAmount,
        lastPaymentDate,
      },
      payments,
      totalTransactions: payments.length,
    });
  } catch (err) {
    console.error("Error fetching customer history:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//agar kuch dikat ayi toh ye shi hai isko chalu rduga

// GET /api/payments/today-pending
// GET /api/payment/today-pending
//old
//exports.getFilteredPayments = async (req, res) => {
//  try {
//    const { status, name, page = 1, limit = 10 } = req.query;

//    const start = new Date();
//    start.setHours(0, 0, 0, 0);
//    const end = new Date();
//    end.setHours(23, 59, 59, 999);

//    const query = {
//      createdAt: { $gte: start, $lte: end }
//    };

//    if (status && status !== "all") query.billStatus = status;
//    if (name) query["userId.name"] = { $regex: name, $options: "i" };

//    const payments = await Payment.find(query)
//      .populate("userId")
//      .skip((page - 1) * limit)
//      .limit(Number(limit));

//    const total = await Payment.countDocuments(query);

//    const data = payments.map((p) => ({
//      _id: p._id,
//      customerName: p.userId?.name,
//      phone: p.userId?.phone,
//      items: p.items,
//      amountPaid: p.amountPaid,
//      billStatus: p.billStatus,
//    }));

//    const totalPages = Math.ceil(total / limit);

//    res.json({ success: true, data, total,page: Number(page),
//  totalPages });
//  } catch (err) {
//    console.error("❌ Error in getFilteredPayments:", err);
//    res.status(500).json({ success: false, message: "Server error" });
//  }
//};

exports.getFilteredPayments = async (req, res) => {
  try {
    const { status, name, page = 1, limit = 10 } = req.query;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      createdAt: { $gte: start, $lte: end },
    };
    if (status && status !== "all") matchStage.billStatus = status;

    const aggregation = [
      { $match: matchStage },
      {
        $lookup: {
          from: "customers",
          localField: "userId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
    ];

    if (name) {
      aggregation.push({
        $match: {
          "customer.name": { $regex: name, $options: "i" },
        },
      });
    }

    aggregation.push({
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }],
        total: [{ $count: "count" }],
      },
    });

    const result = await Payment.aggregate(aggregation);
    const bills = result[0].data;
    const total = result[0].total[0]?.count || 0;

    const data = bills.map((p) => ({
      _id: p._id,
      customerName: p.customer.name,
      phone: p.customer.phone,
      items: p.items,
      amountPaid: p.amountPaid,
      billStatus: p.billStatus,
    }));

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("❌ Error in getFilteredPayments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.billStatus === "sent") {
      return res
        .status(400)
        .json({ message: "Cannot edit, bill already sent" });
    }

    const customer = await Customer.findById(payment.userId);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    const { amountPaid, items, nextPaymentDate, notes } = req.body;

    // ✅ Recalculate total from items
    const enrichedItems = items.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.pricePerUnit,
    }));

    const newTotalAmount = enrichedItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    // ✅ Update payment
    payment.items = enrichedItems;
    payment.amountPaid = amountPaid;
    payment.totalAmount = newTotalAmount;
    payment.nextPaymentDate = nextPaymentDate || payment.nextPaymentDate;
    payment.notes = notes || "";
    payment.status = newTotalAmount - amountPaid === 0 ? "paid" : "due";
    payment.billStatus = "updated";
    await payment.save();

    // ✅ Recalculate customer data
    const customerPayments = await Payment.find({ userId: customer._id });

    const totalPaid = customerPayments.reduce(
      (acc, p) => acc + p.amountPaid,
      0
    );
    const totalAmount = customerPayments.reduce(
      (acc, p) => acc + p.totalAmount,
      0
    );

    customer.paidAmount = totalPaid;
    customer.totalAmount = totalAmount;
    customer.remainingAmount = totalAmount - totalPaid;
    customer.nextPaymentDate =
      customer.remainingAmount > 0 ? nextPaymentDate : null;
    customer.isSent = false; // So cron re-sends it
    await customer.save();

    res.status(200).json({ message: "Bill updated successfully" });
  } catch (err) {
    console.error("❌ Error updating bill:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendBillManually = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("userId");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const customer = payment.userId;

    // Optional: Calculate previous dues
    const oldPayments = await Payment.find({
      userId: customer._id,
      _id: { $ne: payment._id },
      paymentDate: { $lt: payment.paymentDate },
    });

    const previousDue = oldPayments.reduce(
      (acc, p) => acc + (p.totalAmount - p.amountPaid),
      0
    );
    const currentDue = payment.totalAmount - payment.amountPaid;
    const totalDue = previousDue + currentDue;

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

    await sendWhatsAppMessage(customer.phone, message);
    await sendWhatsAppMessage(process.env.OWNER_PHONE, message);

    res.json({ message: "✅ Bill resent successfully" });
  } catch (err) {
    console.error("❌ Error resending bill:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//in future agar esa rha ki custoemr bole ki aaj ke sare bill fir se bhej do to ye kr dega abhi humne ajke latest bill ko update kra hai ki wo re send ho jayega
//const moment = require("moment");

//exports.resendAllBillsForToday = async (req, res) => {
//  try {
//    const { customerId } = req.params;
//    const customer = await Customer.findById(customerId);
//    if (!customer) return res.status(404).json({ message: "Customer not found" });

//    const startOfDay = moment().startOf("day").toDate();
//    const endOfDay = moment().endOf("day").toDate();

//    const paymentsToday = await Payment.find({
//      userId: customerId,
//      createdAt: { $gte: startOfDay, $lte: endOfDay },
//    });

//    if (!paymentsToday.length) return res.status(404).json({ message: "No bills found for today" });

//    for (const payment of paymentsToday) {
//      const oldPayments = await Payment.find({
//        userId: customer._id,
//        _id: { $lt: payment._id }
//      });

//      const previousDue = oldPayments.reduce((acc, p) => acc + (p.totalAmount - p.amountPaid), 0);
//      const currentDue = payment.totalAmount - payment.amountPaid;
//      const totalDue = previousDue + currentDue;

//      const message = buildWhatsAppMessage(
//        customer.name,
//        payment.items,
//        payment.totalAmount,
//        payment.amountPaid,
//        totalDue,
//        customer.nextPaymentDate,
//        payment.paymentDate,
//        previousDue
//      );

//      await sendWhatsAppMessage(customer.phone, message);
//    }

//    res.json({ message: `✅ Resent ${paymentsToday.length} bills for ${customer.name}` });
//  } catch (err) {
//    console.error("❌ Error in resendAllBillsForToday:", err);
//    res.status(500).json({ message: "Server error" });
//  }
//};
