const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { hashToken } = require('../../util/crypto');

router.post('/', async (req, res )=> {
    try{
        const { email, token, newPassword } = req.body;

        // Find user with reset token fields selected (same pattern as verify email)
        const user = await User.findOne({email}).select('+passwordResetTokenHash +passwordResetTokenExp');

        // Check if token exists and is valid (same validation flow)
        if (!user || !user.passwordResetTokenHash || !user.passwordResetTokenExp){
            return res.status(400).json({ok: false, message: 'Invalid or expired reset link.'});
        }

        // Check expiration (same as verify email)
        if (user.passwordResetTokenExp < new Date()){
            return res.status(400).json({ok: false, message: 'Reset link expired'});
        }

        // Verify token matches (same pattern)
        const matches = user.passwordResetTokenHash === hashToken(token);

        if(!matches){
            return res.status(400).json({ok: false, message: 'Invalid or expired reset link.'});
        }

        // Updating the password using the model's bcrypt pre-save hook
        user.passwordHash = newPassword;

        // Clear reset token fields (same as verify email clearing)
        user.passwordResetTokenHash = undefined;
        user.passwordResetTokenExp = undefined;
        await user.save();

        return res.json({ok: true, message: 'Password reset successfully.'});

    }
    catch (e){
        console.error(e);
        return res.status(400).json({ok: false, message: 'Password reset failed.'});
    }
});

module.exports = router