const Inventory = require("../models/Inventory");
const Item = require("../models/Item");

//  Get all inventory items

exports.getAllItems = async (req, res) => {
  // console.log("idr")
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
    const { name, category, price, unit, quantity, lowStockAlert, supplier } =
      req.body;

    const existingItem = await Item.findOne({ name });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item already exists. Please use update instead.",
      });
    }

    // console.log(supplier, "supller");

    const supplierData = supplier?.name
      ? [
          {
            supplierName: supplier.name,
            supplierPhone: supplier.phone,
            supplierAddress: supplier.address,
            purchaseHistory: [
              {
                boughtPrice: supplier.boughtPrice,
                quantityAdded: quantity,
              },
            ],
          },
        ]
      : [];

    const newItem = await Item.create({
      name,
      category,
      price,
      unit,
      currentStock: quantity,
      lowStockAlert,
      suppliers: supplierData,
    });

    return res.status(201).json({
      message: "Item created successfully",
      data: newItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding item", error });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Basic field updates
    if (updates.price !== undefined) item.price = updates.price;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.stockAlert !== undefined)
      item.lowStockAlert = updates.stockAlert;

    const supplier = updates.supplier;

    if (supplier?.phone && supplier?.quantityAdded > 0) {
      item.currentStock += supplier.quantityAdded;

      // 1️⃣ Find existing supplier by phone
      const existingSupplier = item.suppliers.find(
        (s) => s.supplierPhone === supplier.phone
      );

      if (existingSupplier) {
        // 2️⃣ Update supplier profile
        existingSupplier.supplierName =
          supplier.name || existingSupplier.supplierName;
        existingSupplier.supplierPhone =
          supplier.phone || existingSupplier.supplierPhone;
        existingSupplier.supplierAddress =
          supplier.address || existingSupplier.supplierAddress;

        // 3️⃣ Push new purchase record
        existingSupplier.purchaseHistory.push({
          boughtPrice: supplier.boughtPrice,
          quantityAdded: supplier.quantityAdded,
        });
      } else {
        // 4️⃣ Add new supplier if not present
        item.suppliers.push({
          supplierName: supplier.name,
          supplierPhone: supplier.phone,
          supplierAddress: supplier.address,
          purchaseHistory: [
            {
              boughtPrice: supplier.boughtPrice,
              quantityAdded: supplier.quantityAdded,
            },
          ],
        });
      }
    }

    await item.save();
    res.status(200).json(item);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error updating item", error });
  }
};

//  Delete item
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

// GET SUPPLIER HISTORY OF A SPECIFIC ITEM BY PHONE NUMBER
exports.getSupplierByPhone = async (req, res) => {
  try {
    const { itemId, phone } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Find supplier having the phone number
    const supplier = item.suppliers.find((s) => s.supplierPhone === phone);

    if (!supplier) {
      return res.status(404).json({
        message: "No supplier found with this phone for this item",
      });
    }

    res.json({
      itemName: item.name,
      phone,
      supplier,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
