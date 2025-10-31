import axios from "axios";
import { baseURL } from "./baseURL";

export async function getEnvelopeAPI(id) {
    const ret = { code: 1, data: {}, msg: "" };
    try {
        const res = await axios.get(baseURL() + '/api/envelopes/get/' + id, null, { withCredentials: true });
        ret.code = 0;
        ret.data = res.data;
        ret.msg = "Got envelope successfully.";
    } catch (err) {
        console.error('Get envelope failed:', err.response?.data || err.message);
        ret.msg = "Get envelope failed.";
    }

    return ret;
}