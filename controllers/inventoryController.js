const Inventory = require("../models/Inventory");
const Item = require("../models/Item");

// 📦 Get all inventory items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Inventory.find().populate("item");
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inventory", error });
  }
};

// ➕ Add or update item
// exports.addOrUpdateItem = async (req, res) => {
//   try {
//     const { name, quantity, stockAlert, price, supplier } = req.body;
//   console.log(req.body)
//     // Check if item exists in Item collection
//     let item = await Item.findOne({ name });
//     if (!item) item = await Item.create({ name });

//     // Check if item exists in Inventory
//     let inventory = await Inventory.findOne({ item: item._id });

//     if (inventory) {
//       inventory.quantity += quantity;
//       inventory.price = price;
//       await inventory.save();
//     } else {
//       inventory = await Inventory.create({
//         item: item._id,
//         quantity,
//         stockAlert,
//         price,
//       });
//     }

//     // Save supplier history
//     if (supplier && supplier.name) {
//       await SupplierHistory.create({
//         item: item._id,
//         supplierName: supplier.name,
//         supplierPhone: supplier.phone,
//         supplierAddress: supplier.address,
//         boughtPrice: supplier.boughtPrice,
//         quantityAdded: quantity,
//       });
//     }

//     res.status(201).json(inventory);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: "Error adding/updating item", error });
//   }
// };


exports.addOrUpdateItem = async (req, res) => {
  try {
    const { name, quantity, stockAlert, price, supplier } = req.body;

    // Find or create the item
    let item = await Item.findOne({ name });
    if (!item) item = await Item.create({ name });

    // Find inventory for that item
    let inventory = await Inventory.findOne({ item: item._id });

    if (inventory) {
      // Update quantity and price
      inventory.quantity += quantity;
      inventory.price = price;

      // Push new supplier info if provided
      if (supplier && supplier.name) {
        inventory.suppliers.push({
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
          boughtPrice: supplier.boughtPrice,
          quantityAdded: quantity,
        });
      }

      await inventory.save();
    } else {
      // Create new inventory with supplier info if any
      const newInventory = {
        item: item._id,
        quantity,
        stockAlert,
        price,
        suppliers: [],
      };
      if (supplier && supplier.name) {
        newInventory.suppliers.push({
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
          boughtPrice: supplier.boughtPrice,
          quantityAdded: quantity,
        });
      }
      inventory = await Inventory.create(newInventory);
    }

    res.status(201).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error adding/updating item", error });
  }
};


// ✏️ Update item stock
// exports.updateItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     const updatedItem = await Inventory.findByIdAndUpdate(id, updates, {
//       new: true,
//     });
//     res.status(200).json(updatedItem);
//   } catch (error) {
//     res.status(400).json({ message: "Error updating item", error });
//   }
// };

// exports.updateItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     // Update the Inventory document
//     const updatedItem = await Inventory.findByIdAndUpdate(id, updates, { new: true });

//     if (!updatedItem) {
//       return res.status(404).json({ message: "Inventory item not found" });
//     }

//     // If supplier details are included in updates, add to SupplierHistory
//     if (updates.supplier && updates.supplier.name) {
//       // You need to get the Item reference from the Inventory
//       // Assuming Inventory has a ref field 'item' (ObjectId of Item)
//       await SupplierHistory.create({
//         item: updatedItem.item,
//         supplierName: updates.supplier.name,
//         supplierPhone: updates.supplier.phone,
//         supplierAddress: updates.supplier.address || "",
//         boughtPrice: updates.supplier.boughtPrice,
//         quantityAdded: updates.supplier.quantityAdded || updates.quantity || 0,
//       });
//     }

//     res.status(200).json(updatedItem);
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: "Error updating item", error });
//   }
// };


exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const inventory = await Inventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Update basic fields if provided
    if (updates.quantity !== undefined) inventory.quantity = updates.quantity;
    if (updates.price !== undefined) inventory.price = updates.price;
    if (updates.stockAlert !== undefined) inventory.stockAlert = updates.stockAlert;

    // Push new supplier if present
    if (updates.supplier && updates.supplier.name) {
      inventory.suppliers.push({
        supplierName: updates.supplier.name,
        supplierPhone: updates.supplier.phone,
        supplierAddress: updates.supplier.address,
        boughtPrice: updates.supplier.boughtPrice,
        quantityAdded: updates.supplier.quantityAdded || updates.quantity || 0,
      });
    }

    await inventory.save();

    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error updating item", error });
  }
};



// ❌ Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Inventory.findByIdAndDelete(id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};



exports.getSupplierHistoryByInventoryId = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Find the Inventory by _id
    const inventory = await Inventory.findById(itemId);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Return the suppliers array
    res.status(200).json(inventory.suppliers || []);
  } catch (error) {
    console.error("Error fetching supplier history:", error);
    res.status(500).json({ message: "Error fetching supplier history", error });
  }
};