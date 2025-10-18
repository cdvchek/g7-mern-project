const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    next();
};

module.exports = requireAuth;