// auth/tokens.js
const jwt = require('jsonwebtoken');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

function signAccess(userId) {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefresh(userId, jti) { // jti = refresh id for rotation/revocation
    return jwt.sign({ sub: userId, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

module.exports = { signAccess, signRefresh };