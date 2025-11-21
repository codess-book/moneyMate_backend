const Inventory = require("../models/Inventory");

exports.deductStock = async (items) => {
  for (let cartItem of items) {
    const inv = await Inventory.findOne({ item: cartItem.itemId });

    if (!inv) throw new Error(`Item not found: ${cartItem.name}`);

    if (inv.quantity < cartItem.quantity)
      throw new Error(`Low stock: ${cartItem.name}`);

    inv.quantity -= cartItem.quantity;
    await inv.save();
  }
};
