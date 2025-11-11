// src/api/http.js
import axios from 'axios';
import { baseURL } from './baseURL';
import {
    initTokenStore,
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
} from './tokens';

const mode = process.env.ENVIRONMENT;

initTokenStore();

/**
 * Main API instance for all app requests.
 * Has interceptors that attach the access token and handle 401 → refresh → retry.
 */
export const api = axios.create({
    baseURL: baseURL(mode),
    withCredentials: false, // tokens-only
});

/**
 * Separate instance for refresh calls.
 * IMPORTANT: No interceptors here, so we don't accidentally attach the access token.
 */
const refreshApi = axios.create({
    baseURL: baseURL(mode),
    withCredentials: false,
});

let refreshPromise = null;

async function refreshTokens() {
    if (refreshPromise) return refreshPromise;

    const rt = getRefreshToken();
    if (!rt) throw new Error('no refresh token');

    refreshPromise = refreshApi
        .post('/api/auth/refresh', null, {
            headers: { Authorization: `Bearer ${rt}` },
        })
        .then((res) => {
            // Server should return either *ExpiresAt (ms) or *ExpiresIn (seconds)
            let {
                accessToken,
                accessTokenExpiresAt,
                accessTokenExpiresIn,
                refreshToken,
                refreshTokenExpiresAt,
                refreshTokenExpiresIn,
                user,
            } = res.data || {};

            // Fallbacks if the server returns *In (seconds) instead of *At (ms)
            if (!accessTokenExpiresAt && typeof accessTokenExpiresIn === 'number') {
                accessTokenExpiresAt = Date.now() + accessTokenExpiresIn * 1000;
            }
            if (!refreshTokenExpiresAt && typeof refreshTokenExpiresIn === 'number') {
                refreshTokenExpiresAt = Date.now() + refreshTokenExpiresIn * 1000;
            }

            setTokens({
                accessToken,
                accessTokenExpiresAt,
                refreshToken,
                refreshTokenExpiresAt,
                user,
            });

            return true;
        })
        .catch((err) => {
            // Refresh failed → clear everything so app can redirect to login
            clearTokens();
            throw err;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

/** Attach access token to regular API requests */
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/** On 401, refresh once and retry the original request */
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error?.config || {};
        const status = error?.response?.status;

        // If it’s not a 401 or we already retried, just bubble the error
        if (status !== 401 || original._retried) {
            return Promise.reject(error);
        }

        // Mark before awaiting to prevent multi-retry loops on this request
        original._retried = true;

        try {
            await refreshTokens();

            // Re-apply new access token and retry
            const newAccess = getAccessToken();
            original.headers = { ...(original.headers || {}) };
            if (newAccess) original.headers.Authorization = `Bearer ${newAccess}`;

            return api(original);
        } catch {
            // Refresh failed; tokens cleared inside refreshTokens()
            return Promise.reject(error);
        }
    }
);
