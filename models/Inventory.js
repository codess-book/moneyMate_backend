// const mongoose = require("mongoose");

// const inventorySchema = new mongoose.Schema(
//   {
//     item: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Item",
//       required: true,
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       default: 0,
//     },
//     stockAlert: {
//       type: Number,
//       default: 5,
//     },
//     price: {
//       type: Number,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Inventory", inventorySchema);
const mongoose = require("mongoose");

const supplierSubSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true },
    supplierPhone: { type: String, required: true },
    supplierAddress: { type: String },
    boughtPrice: { type: Number, required: true },
    quantityAdded: { type: Number, required: true },
  },
  { timestamps: true }
);

const inventorySchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    stockAlert: {
      type: Number,
      default: 5,
    },
    price: {
      type: Number,
      required: true,
    },
    suppliers: [supplierSubSchema], // <-- Add this
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
