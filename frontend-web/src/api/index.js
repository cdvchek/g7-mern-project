import { hitEndpoint } from "./hitEndpoint.js";
import { setTokens, clearTokens } from "./tokens.js";

/*
All these functions return a javascript object:
{
    code: 0 // 0 or 1, 0 means successful, 1 means error
    data: {} // an object that contains the data from the endpoint
    msg: "" // a string that says what which route succeeded or failed
}
*/

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

export const createLinkTokenAPI = async () => await hitEndpoint('POST', null, '/api/auth/plaid/create-link-token', 'Create plaid link token');
export const exchangeLinkTokenAPI = async (body) => await hitEndpoint('POST', body, '/api/auth/plaid/exchange-public-token', 'Exchange plaid public token');

export const getEnvelopeIDAPI = async (id) => await hitEndpoint('GET', null, '/api/envelopes/get/' + id, 'Get envelope by ID');
export const getMyEnvelopesAPI = async () => await hitEndpoint('GET', null, '/api/envelopes/get/', 'Get my envelopes');
export const createEnvelopeAPI = async (body) => await hitEndpoint('POST', body, '/api/envelopes/post/', 'Create envelope');
export const updateEnvelopeAPI = async (id, body) => await hitEndpoint('PUT', body, '/api/envelopes/put/' + id, 'Update envelope');
export const deleteEnvelopeAPI = async (id) => await hitEndpoint('DELETE', null, '/api/envelopes/delete/' + id, 'Delete envelope');

export const getBanksAPI = async () => await hitEndpoint('GET', null, '/api/banks/get/', 'Get my banks');
export const getAccountsFromBankAPI = async (id) => await hitEndpoint('GET', null, `/api/banks/get/${id}/accounts`, 'Get accounts from bank');
export const refreshBankAccountsAPI = async (id) => await hitEndpoint('POST', null, `/api/banks/refresh/${id}`, 'Refresh accounts of bank');
export const setAccountTrackingAPI = async (accountId, tracking) => await hitEndpoint('PUT', { tracking }, `/api/accounts/put/${accountId}`, 'Tracking account');
export const deleteBankAPI = async (itemId) => await hitEndpoint('DELETE', null, '/api/banks/delete/' + itemId, 'Delete bank');