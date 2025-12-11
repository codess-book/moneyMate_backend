const Customer = require("../models/Customer");
const Payment = require("../models/payment"); // Import this at the top
const { generateCustomerExport } = require("../services/exportExcel");
const ExcelJS = require("exceljs");

// ✅ Export all customers
exports.exportAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();

    const data = customers.map(cust => ({
      name: cust.name,
      phone: cust.phone,
      address: cust.address || "-",
      totalAmount: cust.totalAmount,
      paidAmount: cust.paidAmount,
      remainingAmount: cust.remainingAmount,
      nextPaymentDate: cust.nextPaymentDate?.toLocaleDateString() || "-",
      addedDate: cust.addedDate?.toLocaleDateString() || "-",
      items: cust.items.map(i => `${i.name} (${i.quantity} x ₹${i.pricePerUnit}) = ₹${i.totalPrice}`).join("; ") || "N/A"
    }));

    await generateCustomerExport(data, res, `all_customers.xlsx`);
  } catch (err) {
    console.error("Export All Customers Error:", err);
    res.status(500).json({ message: "Export failed" });
  }
};



exports.exportCustomerHistory = async (req, res) => {
  try {
    const customerId = req.params.id;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const payments = await Payment.find({ userId: customerId }).sort({ paymentDate: 1 });

    const data = [];

    // let grandPaid = 0;
    // let grandRemaining = customer.totalAmount;

    for (const payment of payments) {
      const items = payment.items;
      const todayTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // grandPaid += payment.amountPaid;
      // grandRemaining -= payment.amountPaid;

      items.forEach((item, index) => {
        data.push({
          date: payment.paymentDate.toLocaleDateString("hi-IN"),
          itemName: item.name,
          quantity: item.quantity,
          category:item.category,
          rate: `₹${item.pricePerUnit}`,
          Subtotal: `₹${item.taxableAmount}`,
           gstRate: `₹${item.gstRate}`,
          totalAmount: `₹${item.totalAmount}`,
          todayTotal: index === 0 ? `₹${todayTotal}` : "",
          paidToday: index === 0 ? `₹${payment.amountPaid}` : "",
          remaining: index === 0 ? `₹${payment.dueAmount}` : "",
          
          // grandPaid: index === 0 ? `₹${grandPaid}` : "",
          // grandRemaining: index === 0 ? `₹${grandRemaining}` : "",
        });
      });
    }

    if (data.length === 0) {
      data.push({
        date: "-",
        itemName: "No transactions yet",
        quantity: "",
        // category:"",
        rate: "",
       taxableAmount:"",
        gstRate:"",
       
        totalAmount:"",
        // todayTotal: "",
        paidToday: "",
        remaining: `₹${customer.totalAmount}`,
        // grandPaid: "₹0",
        // grandRemaining: `₹${customer.totalAmount}`,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Customer History");

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Item Name", key: "itemName", width: 20 },
      { header: "Qty", key: "quantity", width: 8 },
      // { header: "Category", key: "category", width: 12 },
      { header: "Rate", key: "rate", width: 10 },
      { header: "TaxableAmont", key: "taxableAmount", width: 15 }, 
      { header: "gstRate", key: "gstRate", width: 12 },
        { header: "TotalAmount", key: "totalAmount", width: 15 },
    
      { header: "Paid Today", key: "paidToday", width: 15 },
      { header: "Remaining", key: "remaining", width: 15 },
      // { header: "Grand Paid", key: "grandPaid", width: 15 },
      // { header: "Grand Remaining", key: "grandRemaining", width: 18 },
    ];

    data.forEach(row => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${customer.name.replace(/\s+/g, "_")}_history.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).json({ message: "Export failed" });
  }
};
