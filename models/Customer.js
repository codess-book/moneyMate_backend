const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // helpful later
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },

    taxableAmount: { type: Number, required: true }, // qty * price
    gstRate: { type: Number, default: 0 }, // optional GST
    gstAmount: { type: Number, default: 0 }, // calculated
    totalAmount: { type: Number, required: true }, // taxable + gst
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    address: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    nextPaymentDate: { type: Date },
    addedDate: { type: Date, default: Date.now },
    items: [itemSchema],
    isSent: { type: Boolean, default: false },
    sendTime: { type: Date },

    lastReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
