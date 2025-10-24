const router = require('express').Router();

router.use("/envelopes", require("./getEnvelopesRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;