const router = require('express').Router();

router.use("/register", require("./registerRoute"));
router.use("/login", require("./loginRoute"));
router.use("/logout", require("./logoutRoute"));
router.use("/plaid", require('./plaidRoute'));
router.use("/me", require('./meRoute'));

module.exports = router;