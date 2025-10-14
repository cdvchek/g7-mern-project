const express = require('express');
const router = express.Router();

const signupRoute = require("./signupRoute");
router.use("/signup", signupRoute);

module.exports = router;