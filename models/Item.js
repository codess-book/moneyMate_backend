

const mongoose = require("mongoose");



const purchaseHistorySchema = new mongoose.Schema({
  boughtPrice: Number,
  quantityAdded: Number,
  date: { type: Date, default: Date.now },
});

const supplierSchema = new mongoose.Schema({
  supplierName: String,
  supplierPhone: String,
  supplierAddress: String,
  purchaseHistory: [purchaseHistorySchema],
   totalSuppliedStock: { 
    type: Number,
    default: 0 
  }
});

supplierSchema.pre("save", function (next) {
  this.totalSuppliedStock = this.purchaseHistory.reduce((sum, p) => {
    return sum + (p.quantityAdded || 0);
  }, 0);
  next();
});

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: ["Pesticides", "Fertilizers", "Cattle Feed", "Seeds", "Others"],
      required: true,
    },

    unit: { type: String, default: "kg" },
    price: { type: Number, required: true }, // selling price
    currentStock: { type: Number, default: 0 },

    lowStockAlert: { type: Number, default: 0},
    Note:{type:String , required:false},
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    suppliers: [supplierSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
