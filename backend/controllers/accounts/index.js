const router = require('express').Router();

router.use("/get", require("./getAccounts.js"));
router.use("/put", require("./putAccounts.js"));
router.use("/", require("./getTotalBalance.js"));

module.exports = router;