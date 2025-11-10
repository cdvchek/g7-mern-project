const router = require('express').Router();

router.use("/get", require("./getAccounts.js"));
router.use("/put", require("./putAccounts.js"));

module.exports = router;