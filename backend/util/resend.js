const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, html, text }) {
    return resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text
    });
}

module.exports = { sendMail };