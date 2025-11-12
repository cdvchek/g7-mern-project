const router = require('express').Router();

router.get('/health', (req, res) => {
    try {
        res.status(200).json({ msg: 'ok' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
});

router.use("/auth", require("./auth"));
router.use("/user", require("./user"));
router.use("/envelopes", require("./envelopes"));
router.use("/transactions", require("./transactions"));
router.use("/transfers", require("./transfers"));
router.use("/banks", require("./banks"));
router.use("/accounts", require("./accounts"));
router.use("/plaid", require('./plaid'));

module.exports = router;
