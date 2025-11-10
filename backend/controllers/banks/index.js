const router = require('express').Router();

router.use("/get", require("./getBanks.js"));
router.use("/refresh", require("./refreshBanks.js"));
router.use("/delete", require("./deleteBanks.js"));

module.exports = router;