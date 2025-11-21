// // models/Payment.js
// const mongoose = require('mongoose');

// const paymentSchema = new mongoose.Schema({
//   userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
//   totalAmount:    Number,
//   amountPaid:     Number,
//   paymentDate:    Date,
//   nextPaymentDate: Date,
//   status:         { type: String, enum: ['paid', 'due'], default: 'due' },

//   items: [{
//     name: String,
//     quantity: Number,
//     pricePerUnit: Number,
//     totalPrice: Number
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },

//   //ye abhi new addd kr rha hu
//    billStatus: {
//     type: String,
//     enum: ['pending', 'sent', 'failed', 'updated'],
//     default: 'pending'
//   },
//   notes: String
// }, {
//   timestamps: true
// });

// module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

// models/Payment.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // helpful later
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },

    taxableAmount: { type: Number, required: true }, // qty * price
    gstRate: { type: Number, default: 0 }, // optional GST
    gstAmount: { type: Number, default: 0 }, // calculated
    totalAmount: { type: Number, required: true }, // taxable + gst
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    // customer
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // invoice totals
    subTotal: { type: Number, required: true }, // sum of taxable amounts
    totalGST: { type: Number, required: true }, // sum of gstAmount
    grandTotal: { type: Number, required: true }, // subTotal + totalGST

    // payment tracking
    amountPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentDate: { type: Date, default: Date.now },
    nextPaymentDate: Date,

    status: {
      type: String,
      enum: ["paid", "due", "partial"],
      default: "due",
    },

    // NEW — GST-ready item list
    items: [itemSchema],

    // meta
    billStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "updated"],
      default: "pending",
    },

    notes: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
