const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html, text, from }) {
    const fromAddr = from || process.env.EMAIL_FROM || 'Budget App <no-reply@resend.dev>';
    console.log('[sendMail] from=', fromAddr, 'to=', to);

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddr,
            to,
            subject,
            html,
            text,
        });

        console.log('[sendMail] data=', data);
        if (error) {
            console.error('[sendMail] error=', error);
            // bubble up for route to handle
            throw new Error(error.message || 'Resend send failed');
        }
        return data;
    } catch (e) {
        console.error('[sendMail] exception=', e);
        throw e;
    }
}

module.exports = { sendMail };
