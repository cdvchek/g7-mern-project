const router = require('express').Router();

router.get('/health', (req, res) => {
    try {
        res.status(200).json({msg: 'ok'});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err});
    }
});

router.use("/auth", require("./auth"));
router.use("/user", require("./user"));
// This routes from the index.js file in the envelope folder to the server index.js file
router.use("/envelopes", require("./envelope"));

module.exports = router;