const router = require('express').Router();
const { User } = require('../../models');
// const requireAuth = require("../../middleware/requireAuth");

router.get('/all', async (req, res) => {
    try {
        const users = await User.find();
        if (!users || users.length === 0) {
            return res.status(200).json({ msg: 'No users in database.' });
        }

        const toSafeJSON = users => users.map(user => user.toSafeJSON());
        const safeUsers = toSafeJSON(users);

        return res.json(safeUsers);
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;