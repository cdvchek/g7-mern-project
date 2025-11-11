const router = require('express').Router();

router.use("/webhook", require("./plaidWebhook.js"));

module.exports = router;