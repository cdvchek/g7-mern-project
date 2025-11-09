// src/auth/tokenStore.js
const KEY = 'auth.tokens.v1';

let memory = {
    accessToken: null,
    accessTokenExpiresAt: 0,
    refreshToken: null,
    refreshTokenExpiresAt: 0,
    user: null,
};

export function loadTokens() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        memory = { ...memory, ...parsed };
    } catch { }
}

export function saveTokens() {
    try {
        localStorage.setItem(KEY, JSON.stringify(memory));
    } catch { }
}

export function setTokens({ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user }) {
    if (accessToken) memory.accessToken = accessToken;
    if (typeof accessTokenExpiresAt === 'number') memory.accessTokenExpiresAt = accessTokenExpiresAt;
    if (refreshToken) memory.refreshToken = refreshToken;
    if (typeof refreshTokenExpiresAt === 'number') memory.refreshTokenExpiresAt = refreshTokenExpiresAt;
    if (user !== undefined) memory.user = user;
    saveTokens();
}

export function clearTokens() {
    memory = { accessToken: null, accessTokenExpiresAt: 0, refreshToken: null, refreshTokenExpiresAt: 0, user: null };
    try { localStorage.removeItem(KEY); } catch { }
}

export function getAccessToken() { return memory.accessToken; }
export function getRefreshToken() { return memory.refreshToken; }
export function getUser() { return memory.user; }

export function isAccessExpired(skewMs = 5000) {
    return !memory.accessToken || Date.now() + skewMs >= (memory.accessTokenExpiresAt || 0);
}

export function initTokenStore() { loadTokens(); }
