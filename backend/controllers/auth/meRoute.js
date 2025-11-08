const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { sendMail } = require('../../util/resend');
const { createToken, hashToken } = require('../../util/crypto');
const TOKEN_TTL_MIN = Number(process.env.TOKEN_TTL_MINUTES);

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
        const { name, email, timezone, currency, password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required to make updates.' });
        }

        const user = await User.findOne({ _id: id }).select('+passwordHash');
        if (!user) {
            return res.status(404).json({ error: "User not found. Please login again." });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const updates = {};
        let newEmail = null;

        if (name !== undefined) {
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Name is not a string and name is empty' });
            }

            updates.name = name.trim();
        }

        if (timezone !== undefined) {
            if (typeof timezone !== 'string' || timezone.trim() === '') {
                return res.status(400).json({ error: 'Timezone must be a non-empty string' });
            }

            updates.timezone = timezone.trim();
        }

        if (currency !== undefined) {
            if (typeof currency !== 'string' || currency.trim() === '') {
                return res.status(400).json({ error: 'Currency must be a non-empty string' });
            }

            updates.currency = currency.trim();
        }

        if (email !== undefined) {
            const normEmail = String(email).trim().toLowerCase();
            
            if (normEmail !== user.email) {
                // Check if new email is in use by different user
                const exists = await User.findOne({ email: normEmail, _id: { $ne: id } });
                if (exists) {
                    return res.status(409).json({ error: "Email already in use." });
                }

                // Add email updates
                updates.email = normEmail;
                updates.emailVerified = false; // Set new email to unverified
                
                // Add verification token
                const raw = createToken();
                updates.emailVerifyTokenHash = hashToken(raw);
                updates.emailVerifyTokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
                await user.save();
                
                newEmail = normEmail; // Set flag to send email

                // Send a new email verification if email was changed
                if (newEmail) {
                    const verifyUrl = `${process.env.APP_URL}/verify_email?token=${raw}&email=${encodeURIComponent(newEmail)}`;

                    await sendMail({
                        to: newEmail,
                        subject: 'Verify your new email',
                        text: `Verify your email: ${verifyUrl}`,
                        html: `
                            <p>Welcome${name ? ', ' + name : ''}!</p>
                            <p>Confirm your email address to finish setting up your account.</p>
                            <p><a href="${verifyUrl}">Verify Email</a></p>
                            <p>This link expires in ${TOKEN_TTL_MIN} minutes.</p>
                        `,
                    });
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(200).json(user.toSafeJSON()); // No updates to make
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