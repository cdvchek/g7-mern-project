import axios from 'axios';
import { baseURL } from './baseURL';

export async function resetPasswordAPI(body) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.post(baseURL() + '/api/auth/reset-password/', body, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Successful password reset.";
    } catch (err) {
        console.error('Password not reset:', err.response?.data || err.message);
        ret.msg = "Password not reset.";
    }
    return ret;
}