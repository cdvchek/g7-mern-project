// routes/auth/login.js
const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../../models');
const { signAccess, signRefresh } = require('../../util/tokens');

// derive exp (ms) from a JWT
function decodeExpMs(token) {
    const decoded = jwt.decode(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
}

router.post('/', async (req, res) => {
    try {
        console.log("login trying");

        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() })
            .select('+passwordHash');
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

        if (!user.emailVerified) {
            return res.status(401).json({ error: 'Email not verified.' });
        }

        // Create a refresh token record (rotation-ready via jti)
        const jti = crypto.randomUUID();
        await RefreshToken.create({
            userId: user._id,
            jti,
            revoked: false,
            userAgent: req.headers['user-agent'] || '',
        });

        // Sign tokens (your util handles TTLs: 15m / 30d)
        const accessToken = signAccess(user.id);
        const refreshToken = signRefresh(user.id, jti);

        // Compute expirations from the tokens themselves
        const accessExpMs = decodeExpMs(accessToken);
        const refreshExpMs = decodeExpMs(refreshToken);

        return res.json({
            user: user.toSafeJSON(),
            tokenType: 'Bearer',
            accessToken,
            accessTokenExpiresAt: accessExpMs,          // epoch ms
            accessTokenExpiresIn: accessExpMs ? Math.max(0, Math.floor((accessExpMs - Date.now()) / 1000)) : 900, // seconds fallback
            refreshToken,
            refreshTokenExpiresAt: refreshExpMs,        // epoch ms
            refreshTokenExpiresIn: refreshExpMs ? Math.max(0, Math.floor((refreshExpMs - Date.now()) / 1000)) : 30 * 24 * 60 * 60, // seconds fallback
        });
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;