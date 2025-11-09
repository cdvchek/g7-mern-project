const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { signAccess, signRefresh } = require('../../util/tokens');
const { User, RefreshToken } = require('../../models');

const router = express.Router();

const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN || '900', 10); // seconds (default 15m)
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function bearerFrom(req) {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m ? m[1] : null;
}

function newJti() {
    // crypto.randomUUID is available in Node 16+
    return require('crypto').randomUUID();
}

// Revoke all refresh tokens for a user (e.g., on suspected reuse)
async function revokeAllForUser(userId) {
    await RefreshToken.updateMany({ userId, revoked: false }, { $set: { revoked: true, updatedAt: new Date() } });
}

router.post('/', express.json(), async (req, res) => {
    try {
        const incoming = bearerFrom(req) || req.body?.refreshToken;
        if (!incoming) return res.status(401).json({ error: 'no refresh token' });
        if (!REFRESH_SECRET) return res.status(500).json({ error: 'server not configured' });

        let decoded;
        try {
            decoded = jwt.verify(incoming, REFRESH_SECRET);
        } catch {
            return res.status(401).json({ error: 'invalid refresh token' });
        }

        const { sub, jti } = decoded || {};
        if (!sub || !jti) {
            return res.status(401).json({ error: 'invalid refresh token payload' });
        }

        // Look up the jti in DB
        const rt = await RefreshToken.findOne({ jti }).lean();
        if (!rt) {
            // Token is cryptographically valid but unknown to DB → probable reuse of an old/rotated token.
            await revokeAllForUser(sub).catch(() => { });
            return res.status(401).json({ error: 'refresh token reuse detected' });
        }
        if (String(rt.userId) !== String(sub)) {
            // Mismatch: revoke everything as a precaution
            await revokeAllForUser(rt.userId).catch(() => { });
            await revokeAllForUser(sub).catch(() => { });
            return res.status(401).json({ error: 'refresh token user mismatch' });
        }
        if (rt.revoked) {
            // Reuse of a revoked token → nuke the set
            await revokeAllForUser(sub).catch(() => { });
            return res.status(401).json({ error: 'refresh token revoked' });
        }

        // Load user (optional but useful to send back user profile)
        const user = await User.findById(sub);
        if (!user) {
            await revokeAllForUser(sub).catch(() => { });
            return res.status(401).json({ error: 'user not found' });
        }

        // ROTATE: create the next refresh token, persist its jti; revoke the used one
        const nextJti = newJti();
        const { token: nextRefreshToken, expiresIn: nextRefreshExpiresIn } = signRefresh({ sub, jti: nextJti });

        // Persist new token doc
        await RefreshToken.create({
            userId: sub,
            jti: nextJti,
            userAgent: req.headers['user-agent'] || '',
            revoked: false,
        });

        // Revoke the used token
        await RefreshToken.updateOne({ jti }, { $set: { revoked: true, updatedAt: new Date() } });

        // Mint access token
        const accessToken = signAccess(sub);

        return res.json({
            accessToken,
            accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
            refreshToken: nextRefreshToken,
            refreshTokenExpiresIn: nextRefreshExpiresIn,
            user: user.toSafeJSON ? user.toSafeJSON() : {
                id: user._id,
                email: user.email,
                name: user.name || '',
                timezone: user.timezone,
                currency: user.currency,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        console.error('[refresh] unexpected error:', err);
        return res.status(500).json({ error: 'server error' });
    }
});

module.exports = router;
