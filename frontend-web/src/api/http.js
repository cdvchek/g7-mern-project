// src/api/http.js
import axios from 'axios';
import { baseURL } from './baseURL';
import {
    initTokenStore, getAccessToken, getRefreshToken, isAccessExpired,
    setTokens, clearTokens
} from './tokens';

initTokenStore();

export const api = axios.create({
    baseURL: baseURL(),
    // DO NOT send cookies; we are token-only:
    withCredentials: false,
});

let refreshPromise = null;

async function refreshTokens() {
    if (refreshPromise) return refreshPromise; // de-dup concurrent 401s
    const rt = getRefreshToken();
    if (!rt) throw new Error('no refresh token');

    refreshPromise = api.post('/api/auth/refresh', null, {
        headers: { Authorization: `Bearer ${rt}` },
    }).then(res => {
        // server returns: { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user? }
        const {
            accessToken, accessTokenExpiresAt,
            refreshToken, refreshTokenExpiresAt,
            user
        } = res.data || {};
        setTokens({ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user });
        return true;
    }).catch(err => {
        clearTokens();
        throw err;
    }).finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}

// Attach Authorization on requests
api.interceptors.request.use(async (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401, try one refresh then retry original request once
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // Only attempt once per request
        const is401 = error?.response?.status === 401;
        const alreadyRetried = original?._retried;
        if (is401 && !alreadyRetried) {
            original._retried = true;

            // If we *know* access is expired or server said 401, refresh
            try {
                await refreshTokens();
                // Re-apply new access token header and retry
                const newAccess = getAccessToken();
                if (newAccess) {
                    original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAccess}` };
                }
                return api(original);
            } catch (e) {
                // fall through—logout UX handled by caller if needed
            }
        }

        return Promise.reject(error);
    }
);
