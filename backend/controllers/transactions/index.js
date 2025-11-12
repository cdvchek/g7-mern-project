const router = require('express').Router();

router.use("/post", require("./postTransactionsRoute")); // Create new transaction
router.use("/get", require("./getTransactionsRoute")); // Handles both GET / and GET /:id
router.use("/put", require("./putTransactionsRoute")); // Update transaction
router.use("/delete", require("./deleteTransactionsRoute")); // Delete transaction

router.use("/", require("./resetTsx"));

module.exports = router;