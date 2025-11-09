const { User } = require('../models');

module.exports = async (req, _res, next) => {
    if (!req.userId) return next();
    req.user = await User.findById(req.userId).lean();
    return next();
};
