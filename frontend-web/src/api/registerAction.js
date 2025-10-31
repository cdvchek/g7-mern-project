import axios from 'axios';
import { baseURL } from './baseURL';

export async function registerAPI(body) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.post(baseURL() + '/api/auth/register/', body, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Successful registration.";
    } catch (err) {
        console.error('Registration failed:', err.response?.data || err.message);
        ret.msg = "Registration failed.";
    }
    return ret;
}