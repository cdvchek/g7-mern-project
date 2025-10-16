const router = require('express').Router();

router.use("/register", require("./registerRoute"));
router.use("/login", require("./loginRoute"));
router.use("/logout", require("./logoutRoute"));

module.exports = router;