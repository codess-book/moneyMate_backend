const Item = require("../models/Item");

exports.deductStock = async (items) => {
  for (const item of items) {
    const inv = await Item.findById(item.itemId);

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
      // here you can send WhatsApp or email
    }
  }
};
