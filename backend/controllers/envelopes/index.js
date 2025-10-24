const router = require('express').Router();

router.use("/envelopes", require("./getEnvelopesRoute"));
router.use("/envelopes", require("./postEnvelopeRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;