const router = require('express').Router();
const { User } = require('../../models');
const { sendMail } = require('../../util/resend');
const { createToken, hashToken } = require('../../util/crypto');

const TOKEN_TTL_MIN = Number(process.env.EMAIL_TOKEN_TTL_MINUTES);

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

        const raw = createToken();
        user.emailVerifyTokenHash = hashToken(raw);
        user.emailVerifyTokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
        await user.save();

        const verifyUrl = `${process.env.APP_URL}/verify_email?token=${raw}&email=${encodeURIComponent(email)}`;

        // Implement our email sending service
        await sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Verify your email: ${verifyUrl}`,
            html: `
                <p>Welcome${name ? ', ' + name : ''}!</p>
                <p>Confirm your email address to finish setting up your account.</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>This link expires in ${TOKEN_TTL_MIN} minutes.</p>
            `,
        });

        return res.status(201).json({ user: user.toSafeJSON() });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
});

module.exports = router;