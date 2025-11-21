// const mongoose=require('mongoose');
// const itemSchema = new mongoose.Schema({
//   name: { type: String, required: true, unique: true, trim: true }
// }, { timestamps: true });

// module.exports=mongoose.model("Item",itemSchema);

const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  supplierName: String,
  supplierPhone: String,
  supplierAddress: String,
  boughtPrice: Number,
  quantityAdded: Number,
  date: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  category: {
    type: String,
    enum: ["Pesticides", "Fertilizers", "Cattle Feed", "Seeds", "Others"],
    required: true,
  },

  unit: { type: String, default: "kg" }, 
  price: { type: Number, required: true },   // selling price
  currentStock: { type: Number, default: 0 },

  lowStockAlert: { type: Number, default: 5 },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

  supplierHistory: [supplierSchema],

}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
