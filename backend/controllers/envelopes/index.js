const router = require('express').Router();

router.use("/", require("./getEnvelopesRoute"));
router.use("/", require("./postEnvelopeRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;