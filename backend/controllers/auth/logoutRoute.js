// routes/auth/logout.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../../models');

router.post('/', async (req, res) => {
    const token = req.body?.refreshToken;
    if (!token) return res.json({ ok: true });

    try {
        const { sub, jti } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        await RefreshToken.deleteOne({ userId: sub, jti });
    } catch (_err) {
        // invalid/expired token → nothing to delete; still return OK
    }

    return res.json({ ok: true });
});

module.exports = router;