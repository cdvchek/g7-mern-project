const router = require('express').Router();
const { User } = require('../../models');

router.post('/', async (req, res) => {
    try {
        const { email, password, name, timezone, currency } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const normEmail = String(email).trim().toLowerCase();

        const exists = await User.findOne({ email: normEmail }).lean(); // .lean() cuts out a lot of unwanted stuff
        if (exists) {
            return res.status(409).json({ error: "Email already in use." });
        }

        const user = await User.create({
            email: normEmail,
            passwordHash: password,
            name: name?.trim() || '',
            timezone: timezone,
            currency: currency,
        });

        req.session.userId = user._id.toString();
        req.session.user = user.toSafeJSON();
        await new Promise((resolve) => req.session.save(resolve));

        return res.status(201).json({ user: user.toSafeJSON() });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
});

module.exports = router;