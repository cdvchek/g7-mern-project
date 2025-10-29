const router = require('express').Router();

router.use("/get", require("./getEnvelopesRoute"));
router.use("/post", require("./postEnvelopeRoute"));
router.use("/put", require("./putEnvelopeRoute"));
router.use("/delete", require("./deleteEnvelopeRoute"));

// This routers to the index.js file in the controller folder
module.exports = router;