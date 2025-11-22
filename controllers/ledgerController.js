const Customer=require("../models/Customer");
const Payment=require("../models/payment");


// GET Ledger for a Customer
exports.getLedger = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    const payments = await Payment.find({ userId: id }).sort({ paymentDate: 1 });

    let ledger = [];
    let totalPaid = 0;

    // --- Add Orders (customer.items)
    customer.items.forEach(item => {
      ledger.push({
        date: item.createdAt || new Date(),
        type: "order",
        itemName: item.name,
        category: item.category,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        gstRate: item.gstRate,
        totalAmount: item.totalAmount,
        paidAmount: 0,
        remainingAmount: null, // fill later
      });
    });

    // --- Add Payments
    payments.forEach(payment => {
      totalPaid += payment.amountPaid;
      ledger.push({
        date: payment.paymentDate || payment.createdAt,
        type: "payment",
        itemName: null,
        category: null,
        quantity: null,
        pricePerUnit: null,
        gstRate: null,
        totalAmount: null,
        paidAmount: payment.amountPaid,
        remainingAmount: customer.totalAmount - totalPaid,
      });
    });

    // --- Fill running balance for orders
    let runningBalance = 0;
    ledger.forEach(entry => {
      if (entry.type === "order") {
        runningBalance += entry.totalAmount;
        entry.remainingAmount = runningBalance - totalPaid;
      }
    });

    res.status(200).json({
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalAmount: customer.totalAmount,
        paidAmount: customer.paidAmount,
        remainingAmount: customer.remainingAmount,
      },
      ledger,
    });

  } catch (err) {
    console.error("❌ Ledger Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
