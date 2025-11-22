const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledgerController");

// GET ledger for a specific customer
router.get("/:id", ledgerController.getLedger);

module.exports = router;