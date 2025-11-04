const router = require('express').Router();
const { User } = require('../../models');

router.post('/', async (req, res) => {
    try {
        const myID = req.session.userId;
        const myUser = await User.findOne({ _id: myID });

        if (!myUser) return res.status(404).json({ error: 'Login again.' });
        return res.json({ user: myUser.toSafeJSON() });
    } catch (err) {
        console.error('[me]', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.put('/', async (req, res) => {
    try {
        const id = req.session.userId;
        const { name, timezone, currency } = req.body;

        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid envelope ID' });
        }

        const updates = {};

        if (name !== undefined) {
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Name is not a string and name is empty' });
            }

            updates.name = name.trim();
        }

        if (timezone !== undefined) {
            if (typeof timezone !== 'string' || color.trim() === '') {
                return res.status(400).json({ error: 'Color must be a non-empty string' });
            }

            updates.timezone = timezone.trim();
        }

        if (currency !== undefined) {
            if (typeof currency !== 'string' || color.trim() === '') {
                return res.status(400).json({ error: 'Color must be a non-empty string' });
            }

            updates.currency = currency.trim();
        }

        const updateMe = await User.findOneAndUpdate(
            { _id: id },
            { $set: updates },
            { new: true }
        );

        if (!updateMe) {
            return res.status(404).json({ error: "Couldn't find own user to update. Login again." });
        }

        return res.json(updateMe.toSafeJSON());
    } catch (err) {
        console.error('Couldnt update me:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;