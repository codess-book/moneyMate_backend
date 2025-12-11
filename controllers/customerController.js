const Customer = require("../models/Customer");
const { sendWhatsAppMessage } = require("../services/whatsappService");
const WhatsAppLog = require("../models/WhatsAppLog");
const Payment = require("../models/payment"); // Import this at the top
const deductStock = require("../services/inventoryService");
//ye purana hai..

exports.buildWhatsAppMessage = function (
  name,
  items,
  total,
  paid,
  remaining,
  nextDate,
  billDate,
  previousDue = 0
) {
  const formattedDate = new Date(billDate).toLocaleDateString("hi-IN");

  const header = `\`\`\`
Items      Qty   Rate   Total
-------------------------------
\`\`\``;

  const itemRows = items
    .map((item) => {
      const itemName = item.name.padEnd(16); // 16 chars
      const qty = String(item.quantity).toString().padStart(3).padEnd(5); // 5 chars
      const rate = `₹${item.pricePerUnit}`.padStart(5).padEnd(7); // 7 chars
      const total = `₹${item.totalPrice}`.padStart(7); // 7 chars
      return `\`\`\`${itemName}${qty}${rate}${total}\`\`\``;
    })
    .join("\n");

  return `
🧾  - दिनांक: ${formattedDate}

नमस्ते *${name}*, आपका आज का ऑर्डर सफलतापूर्वक दर्ज हो गया है।

📦 *आइटम विवरण:*                                        
${header}${itemRows}


🧮 *आज का टोटल*: ₹${total}   
💳 *पिछला बकाया*: ₹${previousDue}                           
💰 *आज का भुगतान*: ₹${paid}
📌 *कुल बकाया*: ₹${remaining}
                                                           


🙏 धन्यवाद! फिर से पधारिए 🙏
`;
};

// exports.addCustomer = async (req, res) => {
//   try {
//     const {
//       name,
//       phone,
//       address,
//       paidAmount = 0,
//       nextPaymentDate,
//       items = [],
//       paymentDate,
//     } = req.body;

//     if (!items.length) {
//       return res.status(400).json({ message: "At least one item is required" });
//     }
//     if (!name || !phone) {
//       return res.status(400).json({ message: "Name and phone are required" });
//     }

//     // gst logic
//     const enrichedItems = items.map((item) => {
//       const quantity = Number(item.quantity);
//       const pricePerUnit = Number(item.pricePerUnit);
//       const gstRate = Number(item.gstRate || 0);

//       // Validation
//       if (quantity <= 0 || pricePerUnit < 0) {
//         throw new Error("Invalid quantity or price");
//       }
//       if (gstRate < 0 || gstRate > 100) {
//         throw new Error("GST rate must be between 0 and 100");
//       }

//       const taxableAmount = Math.round(quantity * pricePerUnit * 100) / 100;
//       const gstAmount =
//         gstRate > 0 ? Math.round(taxableAmount * gstRate * 100) / 10000 : 0;
//       const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

//       return {
//         ...item,
//         category: item.category,
//         quantity,
//         pricePerUnit,
//         gstRate,
//         taxableAmount,
//         gstAmount,
//         totalAmount,
//       };
//     });

//     const subTotal =
//       Math.round(
//         enrichedItems.reduce((sum, item) => sum + item.taxableAmount, 0) * 100
//       ) / 100;

//     const totalGST =
//       Math.round(
//         enrichedItems.reduce((sum, item) => sum + item.gstAmount, 0) * 100
//       ) / 100;

//     const grandTotal = Math.round((subTotal + totalGST) * 100) / 100;

//     const numericPaidAmount = Math.round(Number(paidAmount) * 100) / 100;

//     if (numericPaidAmount < 0) {
//       return res
//         .status(400)
//         .json({ message: "Paid amount cannot be negative" });
//     }
//     if (numericPaidAmount > grandTotal) {
//       return res
//         .status(400)
//         .json({ message: "Paid amount cannot exceed total invoice amount" });
//     }

//     const dueAmount = Math.round((grandTotal - numericPaidAmount) * 100) / 100;

//     const baseDate = paymentDate ? new Date(paymentDate) : new Date();
//     const fallbackDate = new Date(baseDate);

//     // Safely add 1 month (handles edge cases like Jan 31)
//     fallbackDate.setDate(1); // Set to 1st to avoid overflow
//     fallbackDate.setMonth(fallbackDate.getMonth() + 1);
//     fallbackDate.setDate(
//       Math.min(
//         baseDate.getDate(),
//         new Date(
//           fallbackDate.getFullYear(),
//           fallbackDate.getMonth() + 1,
//           0
//         ).getDate()
//       )
//     );

//     const finalNextPaymentDate =
//       dueAmount > 0
//         ? nextPaymentDate
//           ? new Date(nextPaymentDate)
//           : fallbackDate
//         : null;

//     // if customer already exist
//     let customer = await Customer.findOne({ phone });

//     if (customer) {
//       // Update existing customer totals (WITH PROPER ROUNDING)
//       customer.totalAmount =
//         Math.round((customer.totalAmount + grandTotal) * 100) / 100;
//       customer.paidAmount =
//         Math.round((customer.paidAmount + numericPaidAmount) * 100) / 100;
//       customer.remainingAmount =
//         Math.round((customer.totalAmount - customer.paidAmount) * 100) / 100;

//       // FIXED: Use the new nextPaymentDate if there's remaining amount
//       if (customer.remainingAmount > 0) {
//         customer.nextPaymentDate = finalNextPaymentDate;
//       } else {
//         customer.nextPaymentDate = null;
//       }

//       customer.isSent = false;
//       customer.items = [...customer.items, ...enrichedItems];

//       await customer.save();

//       // Create the payment entry
//       await Payment.create({
//         userId: customer._id,
//         subTotal,
//         totalGST,
//         grandTotal,
//         amountPaid: numericPaidAmount,
//         dueAmount,
//         paymentDate: baseDate,
//         nextPaymentDate: finalNextPaymentDate,
//         status:
//           dueAmount === 0 ? "paid" : numericPaidAmount > 0 ? "partial" : "due",
//         items: enrichedItems,
//       });

//       return res.status(200).json({
//         message: "Existing customer updated successfully",
//         customer,
//       });
//     }

//     // create new customer
//     const newCustomer = await Customer.create({
//       name,
//       phone,
//       address,
//       totalAmount: grandTotal,
//       paidAmount: numericPaidAmount,
//       remainingAmount: dueAmount,
//       nextPaymentDate: finalNextPaymentDate,
//       isSent: false,
//       items: enrichedItems,
//     });

//     await Payment.create({
//       userId: newCustomer._id,
//       subTotal,
//       totalGST,
//       grandTotal,
//       amountPaid: numericPaidAmount,
//       dueAmount,
//       paymentDate: baseDate,
//       nextPaymentDate: finalNextPaymentDate,
//       status:
//         dueAmount === 0 ? "paid" : numericPaidAmount > 0 ? "partial" : "due",
//       items: enrichedItems,
//     });
//    console.log("Calling deductStock with items:", enrichedItems);
// try {
//   await deductStock(enrichedItems);
//   console.log("deductStock completed");
// } catch (err) {
//   console.error("Error in deductStock:", err);
//   return res.status(400).json({ message: err.message });
// }


//     return res.status(201).json({
//       message: "Customer added successfully",
//       customer: newCustomer,
//     });
//   } catch (err) {
//     console.error("❌ Error in addCustomer:", err);

//     // Better error handling
//     if (err.message.includes("Invalid") || err.message.includes("GST")) {
//       return res.status(400).json({ message: err.message });
//     }

//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

const Item = require("../models/Item");

exports.addCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      paidAmount = 0,
      nextPaymentDate,
      items = [],
      paymentDate,
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "At least one item is required" });
    }
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // GST and item validation/enrichment
    const enrichedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const pricePerUnit = Number(item.pricePerUnit);
      const gstRate = Number(item.gstRate || 0);
      if (quantity <= 0 || pricePerUnit < 0) {
        throw new Error("Invalid quantity or price");
      }
      if (gstRate < 0 || gstRate > 100) {
        throw new Error("GST rate must be between 0 and 100");
      }

      const taxableAmount = Math.round(quantity * pricePerUnit * 100) / 100;
      const gstAmount =
        gstRate > 0 ? Math.round(taxableAmount * gstRate * 100) / 10000 : 0;
      const totalAmount = Math.round((taxableAmount + gstAmount) * 100) / 100;

      return {
        ...item,
        category: item.category,
        quantity,
        pricePerUnit,
        gstRate,
        taxableAmount,
        gstAmount,
        totalAmount,
      };
    });

    const subTotal =
      Math.round(
        enrichedItems.reduce((sum, item) => sum + item.taxableAmount, 0) * 100
      ) / 100;

    const totalGST =
      Math.round(
        enrichedItems.reduce((sum, item) => sum + item.gstAmount, 0) * 100
      ) / 100;

    const grandTotal = Math.round((subTotal + totalGST) * 100) / 100;

    const numericPaidAmount = Math.round(Number(paidAmount) * 100) / 100;

    if (numericPaidAmount < 0) {
      return res
        .status(400)
        .json({ message: "Paid amount cannot be negative" });
    }
    if (numericPaidAmount > grandTotal) {
      return res
        .status(400)
        .json({ message: "Paid amount cannot exceed total invoice amount" });
    }

    const dueAmount = Math.round((grandTotal - numericPaidAmount) * 100) / 100;

    const baseDate = paymentDate ? new Date(paymentDate) : new Date();
    const fallbackDate = new Date(baseDate);

    // Safely add 1 month (handles edge cases like Jan 31)
    fallbackDate.setDate(1); // Set to 1st to avoid overflow
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    fallbackDate.setDate(
      Math.min(
        baseDate.getDate(),
        new Date(
          fallbackDate.getFullYear(),
          fallbackDate.getMonth() + 1,
          0
        ).getDate()
      )
    );

    const finalNextPaymentDate =
      dueAmount > 0
        ? nextPaymentDate
          ? new Date(nextPaymentDate)
          : fallbackDate
        : null;

    // Check if customer already exists
    let customer = await Customer.findOne({ phone });

    if (customer) {
      // Update existing customer totals (WITH PROPER ROUNDING)
      customer.totalAmount =
        Math.round((customer.totalAmount + grandTotal) * 100) / 100;
      customer.paidAmount =
        Math.round((customer.paidAmount + numericPaidAmount) * 100) / 100;
      customer.remainingAmount =
        Math.round((customer.totalAmount - customer.paidAmount) * 100) / 100;

      if (customer.remainingAmount > 0) {
        customer.nextPaymentDate = finalNextPaymentDate;
      } else {
        customer.nextPaymentDate = null;
      }

      customer.isSent = false;
      customer.items = [...customer.items, ...enrichedItems];

      await customer.save();

      await Payment.create({
        userId: customer._id,
        subTotal,
        totalGST,
        grandTotal,
        amountPaid: numericPaidAmount,
        dueAmount,
        paymentDate: baseDate,
        nextPaymentDate: finalNextPaymentDate,
        status:
          dueAmount === 0 ? "paid" : numericPaidAmount > 0 ? "partial" : "due",
        items: enrichedItems,
      });

      // Deduct stock for each item
      for (const item of enrichedItems) {
        console.log(item, "item here")
        const inv = await Item.findOne({ category: item.category, name: item.name });
        if (!inv) {
          throw new Error(`Item not found: ${item.name}`);
        }

        const requiredQty = Number(item.quantity);
        const availableQty = Number(inv.currentStock);

        if (availableQty < requiredQty) {
          throw new Error(
            `Low stock for ${inv.name}. Available: ${availableQty}, Required: ${requiredQty}`
          );
        }

        inv.currentStock = availableQty - requiredQty;
        await inv.save();

        if (inv.currentStock <= inv.lowStockAlert) {
          console.log(`⚠️ Low stock alert for ${inv.name}`);
          // You can trigger notifications here (email, WhatsApp, etc.)
        }
      }

      return res.status(200).json({
        message: "Existing customer updated successfully",
        customer,
      });
    }

    // Create new customer
    const newCustomer = await Customer.create({
      name,
      phone,
      address,
      totalAmount: grandTotal,
      paidAmount: numericPaidAmount,
      remainingAmount: dueAmount,
      nextPaymentDate: finalNextPaymentDate,
      isSent: false,
      items: enrichedItems,
    });

    await Payment.create({
      userId: newCustomer._id,
      subTotal,
      totalGST,
      grandTotal,
      amountPaid: numericPaidAmount,
      dueAmount,
      paymentDate: baseDate,
      nextPaymentDate: finalNextPaymentDate,
      status:
        dueAmount === 0 ? "paid" : numericPaidAmount > 0 ? "partial" : "due",
      items: enrichedItems,
    });

    // Deduct stock for each item (new customer)
    for (const item of enrichedItems) {
      const inv = await Item.findOne({ category: item.category, name: item.name });
      if (!inv) {
        throw new Error(`Item not found: ${item.name}`);
      }

      const requiredQty = Number(item.quantity);
      const availableQty = Number(inv.currentStock);

      if (availableQty < requiredQty) {
        throw new Error(
          `Low stock for ${inv.name}. Available: ${availableQty}, Required: ${requiredQty}`
        );
      }

      inv.currentStock = availableQty - requiredQty;
      await inv.save();

      if (inv.currentStock <= inv.lowStockAlert) {
        console.log(`⚠️ Low stock alert for ${inv.name}`);
        // You can trigger notifications here (email, WhatsApp, etc.)
      }
    }

    return res.status(201).json({
      message: "Customer added successfully",
      customer: newCustomer,
    });
  } catch (err) {
    console.error("❌ Error in addCustomer:", err);

    if (err.message.includes("Invalid") || err.message.includes("GST")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ customer });
  } catch (err) {
    console.error("Error in getCustomerByPhone:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//the format in which

exports.listCustomers = async (req, res) => {
  try {
    // 1) Read query params
    const {
      page = 1,
      limit = 10,
      search = "",
      dateFrom,
      dateTo,
      month,
    } = req.query;

    const filters = {};

    // 2) Text search by name (case‐insensitive)
    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }

    // 3) Date range filter on addedDate
    if (dateFrom || dateTo) {
      filters.addedDate = {};
      if (dateFrom) filters.addedDate.$gte = new Date(dateFrom);
      if (dateTo) filters.addedDate.$lte = new Date(dateTo);
    }

    // 4) Month filter (YYYY-MM)
    if (month) {
      const [y, m] = month.split("-"); // e.g. "2025-06"
      filters.addedDate = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      };
    }

    // 5) Count total matching
    const total = await Customer.countDocuments(filters);

    // 6) Fetch page of customers, sorted by newest first
    const customers = await Customer.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // 7) Send response
    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      customers, // array of docs
    });
  } catch (err) {
    console.error("Error in listCustomers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//for deleting cutomers
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if customer exists
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 2. Delete all payments associated with the customer
    await Payment.deleteMany({ userId: id });

    // 3. Delete the customer
    await Customer.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Customer and payment history deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  console.log("🔥 HIT updateCustomer route");
  console.log("🆔 ID received:", req.params.id);
  console.log(req.id);
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendReminder = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    // ✅ Common Message Format
    const message = `📢 Dear ${customer.name}, your payment of ₹${customer.totalAmount - customer.paidAmount
      } is still pending. Please pay soon.
    
    प्रिय ${customer.name}, आपका ₹${customer.totalAmount - customer.paidAmount
      } का भुगतान अभी बाकी है। कृपया जल्द भुगतान करें।

🙏 धन्यवाद!
    `;

    // ✅ Send to Customer
    await sendWhatsAppMessage(`+91${customer.phone}`, message);

    // ✅ Owner Message Format
    const ownerMessage = `📬 Reminder sent to ${customer.name} (${customer.phone
      }) for pending amount ₹${customer.totalAmount - customer.paidAmount}.`;

    // ✅ Send to Owner
    await sendWhatsAppMessage(process.env.OWNER_PHONE, ownerMessage);

    res.status(200).json({ message: "Reminder sent!" });
  } catch (err) {
    console.error("Reminder error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
