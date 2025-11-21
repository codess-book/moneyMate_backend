const Inventory = require("../models/Inventory");
const Item = require("../models/Item");

// 📦 Get all inventory items
exports.getAllItems = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      category,
      unit,
      status,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {};

    // Search (name + category + unit)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { unit: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category) query.category = category;

    // Unit filter
    if (unit) query.unit = unit;

    // Status filter (active / inactive)
    if (status) query.status = status;

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Fetch items with pagination
    const items = await Item.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCount = await Item.countDocuments(query);

    res.status(200).json({
      success: true,
      metadata: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
      items,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching items", error });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { name, category, price, unit, stock, lowStockAlert, supplier } = req.body;

    // 1️⃣ Check if item already exists → deny (update is a separate API)
    const existingItem = await Item.findOne({ name });
    if (existingItem) {
      return res.status(400).json({
        message: "Item already exists. Please use update instead."
      });
    }

    // 2️⃣ Create new supplier history entry (only if supplier is provided)
    const supplierEntry = supplier?.name
      ? {
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
          boughtPrice: supplier.boughtPrice,
          quantityAdded: stock
        }
      : null;

    // 3️⃣ Create item
    const newItem = await Item.create({
      name,
      category,
      price,
      unit,
      currentStock: stock,
      lowStockAlert,
      supplierHistory: supplierEntry ? [supplierEntry] : []
    });

    return res.status(201).json({
      message: "Item created successfully",
      data: newItem
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding item", error });
  }
};

// exports.addOrUpdateItem = async (req, res) => {
//   try {
//     const { name, category, price, unit, stock, lowStockAlert, supplier } = req.body;

//     let item = await Item.findOne({ name });

//     if (!item) {
//       // New item create
//       item = await Item.create({
//         name,
//         category,
//         price,
//         unit,
//         currentStock: stock,
//         lowStockAlert,
//         supplierHistory: supplier?.name ? [{
//           supplierName: supplier.name,
//           supplierPhone: supplier.phone,
//           supplierAddress: supplier.address,
//           boughtPrice: supplier.boughtPrice,
//           quantityAdded: stock,
//         }] : []
//       });

//     } else {
//       // Existing item update
//       item.currentStock += stock;
//       item.price = price;
//       item.unit = unit;
//       if (lowStockAlert) item.lowStockAlert = lowStockAlert;

//       if (supplier?.name) {
//         item.supplierHistory.push({
//           supplierName: supplier.name,
//           supplierPhone: supplier.phone,
//           supplierAddress: supplier.address,
//           boughtPrice: supplier.boughtPrice,
//           quantityAdded: stock,
//         });
//       }

//       await item.save();
//     }

//     res.status(201).json(item);

//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ message: "Error adding/updating item", error });
//   }
// };

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Basic field updates
    if (updates.price !== undefined) item.price = updates.price;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.lowStockAlert !== undefined) item.lowStockAlert = updates.lowStockAlert;

    // Supplier update only if stock is added
    if (
      updates.supplier?.name &&
      updates.supplier?.quantityAdded &&
      updates.supplier.quantityAdded > 0
    ) {
      // increase stock
      item.currentStock += updates.supplier.quantityAdded;

      // push supplier entry
      item.supplierHistory.push({
        supplierName: updates.supplier.name,
        supplierPhone: updates.supplier.phone,
        supplierAddress: updates.supplier.address,
        boughtPrice: updates.supplier.boughtPrice,
        quantityAdded: updates.supplier.quantityAdded
      });
    }

    await item.save();
    res.status(200).json(item);

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error updating item", error });
  }
};




// ❌ Delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error });
  }
};


exports.getSupplierHistory = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item.supplierHistory);

  } catch (error) {
    res.status(500).json({ message: "Error fetching supplier history", error });
  }
};
