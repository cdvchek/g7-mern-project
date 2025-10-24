const router = require('express').Router();

router.use("/get", require("./getEnvelopesRoute"));
router.use("/post", require("./postEnvelopeRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;