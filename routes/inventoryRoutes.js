const express = require("express");
const {
  getAllItems,
  addItem,
  updateItem,
  deleteItem,
  getSupplierHistory
} = require("../controllers/inventoryController");

const router = express.Router();

router.get("/allItems", getAllItems);
router.post("/", addItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);
router.get("/supplier-history/:itemId", getSupplierHistory);

module.exports = router;
