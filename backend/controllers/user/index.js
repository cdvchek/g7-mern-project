const router = require('express').Router();

router.use("/get", require("./getUsersRoutes"));

module.exports = router;