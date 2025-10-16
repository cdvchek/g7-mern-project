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

module.exports = router;