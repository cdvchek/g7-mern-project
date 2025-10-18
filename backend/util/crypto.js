const crypto = require('crypto');

let KEY = null;
if (process.env.PLAID_ENCRYPTION_KEY_BASE64) KEY = Buffer.from(process.env.PLAID_ENCRYPTION_KEY_BASE64, 'base64');

const encrypt = (text) => {
    if (!KEY) return { ct: text, iv: null, tag: null, v: 0 };

    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
    const ct = Buffer.concat([c.update(text, 'utf8'), c.final()]);
    const tag = c.getAuthTag();

    return { ct: ct.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64'), v: 1 };
}
const decrypt = (payload) => {
    if (!payload) return null;
    if (!KEY || payload.v !== 1) return payload.ct;

    const d = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(payload.iv, 'base64'));
    d.setAuthTag(Buffer.from(payload.tag, 'base64'));

    const pt = Buffer.concat([d.update(Buffer.from(payload.ct, 'base64')), d.final()]);

    return pt.toString('utf8');
}
module.exports = { encrypt, decrypt };
