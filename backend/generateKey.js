const crypto = require('crypto');
const key = crypto.randomBytes(32);
console.log(key.toString('base64'));