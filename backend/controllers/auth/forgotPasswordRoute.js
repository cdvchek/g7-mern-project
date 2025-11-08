const router = require('express').Router();
const { User } = require('../../models');
const { sendMail } = require('../../util/resend');
const { createToken, hashToken } = require('../../util/crypto');

const TOKEN_TTL_MIN = Number(process.env.TOKEN_TTL_MINUTES) || 60; // Using registration route as reference

router.post('/', async (req, res) => {
    try{
        const { email } = req.body || {};

        // Check if email was provided
        if(!email){
            return res.status(400).json({error: "Email is required."});
        }

        const normEmail = String(email).trim().toLowerCase();

        // Find user by email
        const user = await User.findOne({ email: normEmail});

        if(user){
            // Generating token and hashing it
            const rawToken = createToken();
            const hashedToken = hashToken(rawToken);

            // Store hashed token and expiration on user
            user.passwordResetTokenHash = hashToken;
            user.passwordResetTokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
            
            await user.save();

            // Constructing the reset URL with token and email as parameters
            const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(normEmail)}`;

            // Senf email with reset link
            await sendMail({
                to: normEmail,
                subject: 'Reset Your Password',
                text: `Reset your password: ${resetUrl}`,
                html: `
                    <p>You requested a password reset.<p>
                    <p>Click the link below to reset your password:</p>
                    <p><a href="${resetUrl}">Reset Password</a></p>
                    <p>This link expires in ${TOKEN_TTL_MIN} minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    `,
            });
        }
        // Always return same 200 status and general message for security
        return res.status(200).json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
    catch(err){
        console.error('[forgot-password]', err);
        return res.status(500).json({error: 'Server error'});
    }
});

module.exports = router;