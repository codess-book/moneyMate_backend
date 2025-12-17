const express = require("express");
const router = express.Router();
// const Invoice = require("../models/Invoice");
const Invoice=require("../models/invoiveSchema");

router.get("/:invoiceNo", async (req, res) => {
    console.log("htt");
  try {
    const invoice = await Invoice.findOne({ invoiceNo: req.params.invoiceNo });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error",err });
  }
});

module.exports = router;
