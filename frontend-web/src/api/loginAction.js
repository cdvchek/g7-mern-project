import axios from 'axios';
import { baseURL } from './baseURL';

export async function loginAPI(body) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.post(baseURL() + '/api/auth/login/', body, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Successful login.";
    } catch (err) {
        console.error('Login failed:', err.response?.data || err.message);
        ret.msg = "Login failed.";
    }
    return ret;
}