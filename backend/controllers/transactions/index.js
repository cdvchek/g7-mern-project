const router = require('express').Router();

router.get("/", require("./getTransactionsRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;