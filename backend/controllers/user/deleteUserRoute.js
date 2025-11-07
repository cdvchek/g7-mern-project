const router = require('express').Router();
const { User } = require("../../models");

router.delete('/me', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ ok: false, message: "Not logged in" });
        }

        await User.findByIdAndDelete(req.session.userId);

        // destroy session so they’re not logged in anymore
        req.session.destroy(() => { });

        return res.json({ ok: true, message: "User deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
});

module.exports = router;