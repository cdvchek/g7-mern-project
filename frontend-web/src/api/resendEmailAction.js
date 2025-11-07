import axios from 'axios';
import { baseURL } from './baseURL';

export async function resendEmailAPI(body) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.post(baseURL() + '/api/auth/verify-email/resend', body, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Email sent.";
    } catch (err) {
        console.error('Email not sent:', err.response?.data || err.message);
        ret.msg = "Email not sent.";
    }
    return ret;
}