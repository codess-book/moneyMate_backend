const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: String,
    phone:String,
    address:String,
    items: Array,
    subTotal: Number,
    totalGST: Number,
    grandTotal: Number,
    paidAmount: Number,
    dueAmount: Number,
    nextPaymentDate: Date,
    paymentDate: Date,
    invoiceNo: { type: String, unique: true }, // auto generate
    invoiceUrl: String, // Frontend public URL
    billStatus: { type: String, default: "new" }, // new / updated
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
