const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  type: { type: String, enum: ["payment", "invoice", "adjustment"], required: true },
  description: { type: String }, // e.g., "Partial payment for Nov"
  items: [
    {
      name: String,
      category: String,
      quantity: Number,
      pricePerUnit: Number,
      totalAmount: Number,
    }
  ],
  amountPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Ledger", ledgerSchema);
