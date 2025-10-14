const router = require('express').Router();

router.use("/signup", require("./signupRoute"));

module.exports = router;