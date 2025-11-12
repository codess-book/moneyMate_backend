const express = require("express");
const {
  getAllItems,
  addOrUpdateItem,
  updateItem,
  deleteItem,
  getSupplierHistoryByInventoryId
} = require("../controllers/inventoryController");

const router = express.Router();

router.get("/", getAllItems);
router.post("/", addOrUpdateItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);
router.get("/supplier-history/:itemId", getSupplierHistoryByInventoryId);

module.exports = router;
