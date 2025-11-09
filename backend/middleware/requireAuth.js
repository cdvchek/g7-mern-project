// middleware/requireAuth.js
const jwt = require('jsonwebtoken');

/**
 * Extracts a bearer token from common places.
 * We only *accept* Authorization by default, but leave hooks for others if you ever need them.
 */
function getAccessToken(req) {
    const auth = req.headers.authorization || '';
    // Allow case-insensitive "bearer"
    const [scheme, token] = auth.split(' ');
    if (scheme && scheme.toLowerCase() === 'bearer' && token) return token.trim();

    // If you *really* want to support alternate headers later (not recommended), uncomment:
    // if (req.headers['x-access-token']) return String(req.headers['x-access-token']).trim();

    return null;
}

/**
 * Strict auth: requires a valid access token.
 * On success: sets req.userId to the JWT subject.
 */
function requireAuth(req, res, next) {
    const token = getAccessToken(req);
    if (!token) {
        return res.status(401).json({ error: 'unauthorized', reason: 'missing_token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET); // HS256 default
        req.userId = payload.sub;
        // (optional) attach scopes/roles if you put them in the token:
        // req.scopes = payload.scopes || [];
        return next();
    } catch (err) {
        // Give clearer feedback during dev; keep it generic otherwise
        const dev = process.env.NODE_ENV !== 'production';
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'unauthorized', reason: 'token_expired', ...(dev && { expiredAt: err.expiredAt }) });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'unauthorized', reason: 'invalid_token', ...(dev && { message: err.message }) });
        }
        return res.status(401).json({ error: 'unauthorized' });
    }
}

module.exports = requireAuth;