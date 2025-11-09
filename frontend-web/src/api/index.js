import { hitEndpoint } from "./hitEndpoint.js";
import { setTokens, clearTokens } from "./tokens.js";

export const loginAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/login/', 'Login',
    (data) => {
        setTokens({
            accessToken: data.accessToken,
            accessTokenExpiresAt: data.accessTokenExpiresAt,
            refreshToken: data.refreshToken,
            refreshTokenExpiresAt: data.refreshTokenExpiresAt,
            user: data.user
        })
    },
    () => clearTokens()
);
export const registerAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/register/', 'Registration');

export const verifyEmailAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/verify-email/', 'Verify email');
export const resendEmailAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/verify-email/resend', 'Resend verify email');

export const startPasswordResetAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/forgot-password/', 'Forgot password');
export const resetPasswordAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/reset-password/', 'Reset password');

export const getEnvelopeIDAPI = async (id) => await hitEndpoint('GET', null, '/api/envelopes/get/' + id, 'Get envelope by ID');
export const getMyEnvelopesAPI = async () => await hitEndpoint('GET', null, '/api/envelopes/get/', 'Get my envelopes');