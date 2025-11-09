import { api } from "./http.js";

export const hitEndpoint = async (type, body, endpoint, route_name, post = (data) => { }, error = () => { }) => {
    console.log("hitEndpiont", type, body, endpoint, route_name);

    const ret = { code: 1, data: {}, msg: '' };
    try {
        let res;
        switch (type) {
            case 'POST':
                res = await api.post(endpoint, body);
                break;

            case 'GET':
                res = await api.get(endpoint, body);
                break;

            case 'PUT':
                res = await api.put(endpoint, body);
                break;

            case 'DELETE':
                res = await api.delete(endpoint, body);
                break;

            default:
                console.error("Unsupported endpoint type used.");
                break;
        }
        ret.data = res.data || {};
        post(ret.data);
        ret.code = 0;
        ret.msg = route_name + ' successful';
    } catch (err) {
        console.error(route_name + ' failed');
        console.error('Backend Endpoint Failed: ', err);
        ret.msg = route_name + ' failed';
        error();
    }
    return ret;
}