const router = require('express').Router();
const { User } = require("../../models");
const { hashToken } = require("../../util/crypto");

const TOKEN_TTL_MIN = Number(process.env.EMAIL_TOKEN_TTL_MINUTES);

router.post('/', async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email }).select('+emailVerifyTokenHash +emailVerifyTokenExp');

        if (!user || !user.emailVerifyTokenHash || !user.emailVerifyTokenExp)
            return res.status(400).json({ ok: false, message: 'Invalid or expired link.' });

        if (user.emailVerifyTokenExp < new Date())
            return res.status(400).json({ ok: false, message: 'Link expired.' });

        const matches = user.emailVerifyTokenHash === hashToken(token);
        if (!matches)
            return res.status(400).json({ ok: false, message: 'Invalid or expired link.' });

        user.emailVerified = true;
        user.emailVerifyTokenHash = undefined;
        user.emailVerifyTokenExp = undefined;
        await user.save();

        return res.json({ ok: true, message: 'Email verified.' });
    } catch (e) {
        console.error(e);
        return res.status(400).json({ ok: false, message: 'Verification failed.' });
    }
});

router.post('/resend', async (req, res) => {
    try {
        const { email } = req.body
        const normEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({ email: normEmail }).lean(); // .lean() cuts out a lot of unwanted stuff
        if (!user) {
            return res.status(409).json({ error: "Email not found." });
        }

        const raw = createToken();
        user.emailVerifyTokenHash = hashToken(raw);
        user.emailVerifyTokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
        await user.save();

        const verifyUrl = `${process.env.APP_URL}/verify_email?token=${raw}&email=${encodeURIComponent(email)}`;

        await sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Verify your email: ${verifyUrl}`,
            html: `
                <p>Welcome!</p>
                <p>Confirm your email address to finish setting up your account.</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>This link expires in ${TOKEN_TTL_MIN} minutes.</p>
            `,
        });

        return res.status(200).json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(400).json({ ok: false, message: 'Resending email failed.' });
    }
});

module.exports = router;