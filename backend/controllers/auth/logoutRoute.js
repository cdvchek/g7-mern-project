const router = require('express').Router();

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie(req.session?.name || 'sid');
        return res.json({ ok: true });
    });
});

module.exports = router;