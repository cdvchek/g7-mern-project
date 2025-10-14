const router = require('express').Router();

router.get('/', async (req, res) => {
    try {
        res.status(200).json({msg: "ok"});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err});
    }
});

module.exports = router;