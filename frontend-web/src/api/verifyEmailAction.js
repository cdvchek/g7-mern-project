import axios from 'axios';
import { baseURL } from './baseURL';

export async function verifyEmailAPI(body) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.post(baseURL() + '/api/auth/verify-email/', body, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Successful email verification.";
    } catch (err) {
        console.error('Email not verified:', err.response?.data || err.message);
        ret.msg = "Email not verified.";
    }
    return ret;
}