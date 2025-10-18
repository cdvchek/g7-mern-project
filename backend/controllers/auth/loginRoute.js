const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../../models');

router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash'); // ← required because select: false
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

        req.session.userId = user._id.toString();
        req.session.user = user.toSafeJSON();
        await new Promise((resolve) => req.session.save(resolve));

        return res.json({ user: user.toSafeJSON() });
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;