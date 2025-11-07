const router = require('express').Router();

router.use("/get", require("./getUsersRoutes"));
router.use("/delete", require("./deleteUserRoute"));

module.exports = router;