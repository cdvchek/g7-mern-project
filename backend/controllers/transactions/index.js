const router = require('express').Router();

router.post("/", require("./postTransactionsRoute")); // Create new transaction
router.use("/", require("./getTransactionsRoute")); // Handles both GET / and GET /:id
router.put("/:id", require("./putTransactionsRoute")); // Update transaction
router.delete("/:id", require("./deleteTransactionsRoute")); // Delete transaction

module.exports = router;