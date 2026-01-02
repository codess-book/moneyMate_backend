
const mongoose=require("mongoose");

const notificationSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the inventory item
    ref: "Item",
  },
  name: {
    type: String,  // Item name or notification title
    required: true,
  },
  message: {
    type: String, // Optional detailed message
  },
  currentStock: {
    type: Number, // Current stock level
  },
  lowStockAlert: {
    type: Number, // Stock threshold for alert
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

