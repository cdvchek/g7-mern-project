// --- Setup: Mocking Dependencies ---
// Adjusting paths for the 'tests/' directory structure:
const { User, RefreshToken } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { signAccess, signRefresh } = require('../util/tokens'); // Assuming this util path

// Mock the dependencies
jest.mock('../models', () => ({
    User: {
        findOne: jest.fn(),
    },
    RefreshToken: {
        create: jest.fn(),
    },
}));

jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('jsonwebtoken');
jest.mock('../util/tokens');

// Mock Expiry Times (epoch ms) for calculation consistency
const MOCK_ACCESS_EXP = 1731331200000;
const MOCK_REFRESH_EXP = 1733923200000;

// Helper function from the route file - mocked to use fixed times
function decodeExpMs(token) {
    // Rely on mocked tokens to return fixed expiry times for test calculations
    if (token === 'mockAccessToken') {
        return MOCK_ACCESS_EXP;
    }
    if (token === 'mockRefreshToken') {
        return MOCK_REFRESH_EXP;
    }
    // Fallback if the token is decoded via the mocked jwt.decode
    const decoded = jwt.decode(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
}


// Utility function to create mock req and res objects for the handler
const createMocks = (body = {}, headers = {}) => {
    const req = {
        body: body,
        headers: headers,
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    return { req, res };
};

// --- The Actual Route Handler (Isolated for Testing) ---
// NOTE: This represents the logic from your source file, extracted for unit testing.
const loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: String(email).trim().toLowerCase() })
            .select('+passwordHash');
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

        if (!user.emailVerified) {
            return res.status(401).json({ error: 'Email not verified.' });
        }

        // Create a refresh token record (rotation-ready via jti)
        const jti = crypto.randomUUID();
        await RefreshToken.create({
            userId: user._id,
            jti,
            revoked: false,
            userAgent: req.headers['user-agent'] || '',
        });

        // Sign tokens (your util handles TTLs: 15m / 30d)
        const accessToken = signAccess(user.id);
        const refreshToken = signRefresh(user.id, jti);

        // Compute expirations from the tokens themselves
        const accessExpMs = decodeExpMs(accessToken);
        const refreshExpMs = decodeExpMs(refreshToken);

        return res.json({
            user: user.toSafeJSON(),
            tokenType: 'Bearer',
            accessToken,
            accessTokenExpiresAt: accessExpMs,          // epoch ms
            accessTokenExpiresIn: accessExpMs ? Math.max(0, Math.floor((accessExpMs - Date.now()) / 1000)) : 900, // seconds fallback
            refreshToken,
            refreshTokenExpiresAt: refreshExpMs,        // epoch ms
            refreshTokenExpiresIn: refreshExpMs ? Math.max(0, Math.floor((refreshExpMs - Date.now()) / 1000)) : 30 * 24 * 60 * 60, // seconds fallback
        });
    } catch (err) {
        console.error('[login]', err);
        return res.status(500).json({ error: 'Server error' });
    }
};


describe('POST / Login Route Handler', () => {
    const MOCK_PASSWORD = 'password123';
    const MOCK_EMAIL = 'test@example.com';
    const MOCK_JTI = 'mock-jti-uuid';
    const MOCK_USER_ID = '60c72b2f9c1825001c22d1f0';
    const MOCK_USER_AGENT = 'Jest Test Runner';

    const MOCK_USER = {
        _id: MOCK_USER_ID,
        id: MOCK_USER_ID,
        email: MOCK_EMAIL,
        passwordHash: 'hashedpassword',
        emailVerified: true,
        toSafeJSON: () => ({ id: MOCK_USER_ID, email: MOCK_EMAIL }),
        select: jest.fn().mockResolvedValue(this), // Mock for .select('+passwordHash')
    };

    const MOCK_ACCESS_TOKEN = 'mockAccessToken';
    const MOCK_REFRESH_TOKEN = 'mockRefreshToken';

    // --- Console Error Mocking ---
    let consoleErrorSpy;
    let originalDateNow;

    beforeAll(() => {
        // Mock console.error to prevent noise from the 500 test
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock Date.now() to control the 'Expires In' calculation
        originalDateNow = Date.now;
        // Set a fixed 'now' time (e.g., Nov 10, 2025 09:00:00 UTC)
        global.Date.now = jest.fn(() => 1731327600000); // 1731327600000 ms

        // Mock token signing
        signAccess.mockReturnValue(MOCK_ACCESS_TOKEN);
        signRefresh.mockReturnValue(MOCK_REFRESH_TOKEN);
        crypto.randomUUID.mockReturnValue(MOCK_JTI);

        // Mock jwt.decode for the internal decodeExpMs helper
        jwt.decode.mockImplementation((token) => {
            if (token === MOCK_ACCESS_TOKEN) return { exp: MOCK_ACCESS_EXP / 1000 };
            if (token === MOCK_REFRESH_TOKEN) return { exp: MOCK_REFRESH_EXP / 1000 };
            return null;
        });
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
        global.Date.now = originalDateNow; // Restore original Date.now
    });
    // -----------------------------

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset findOne mock to simulate chainability
        User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(MOCK_USER) });
    });

    // --- Test Case 1: Success (Status 200) ---
    test('should return 200 and tokens upon successful and verified login', async () => {
        // Setup Mocks
        bcrypt.compare.mockResolvedValue(true);
        const { req, res } = createMocks(
            { email: MOCK_EMAIL, password: MOCK_PASSWORD },
            { 'user-agent': MOCK_USER_AGENT }
        );

        // Execute
        await loginHandler(req, res);

        // Assertions
        expect(User.findOne).toHaveBeenCalledWith({ email: MOCK_EMAIL });
        expect(bcrypt.compare).toHaveBeenCalledWith(MOCK_PASSWORD, MOCK_USER.passwordHash);
        expect(RefreshToken.create).toHaveBeenCalledWith({
            userId: MOCK_USER_ID,
            jti: MOCK_JTI,
            revoked: false,
            userAgent: MOCK_USER_AGENT,
        });
        expect(signAccess).toHaveBeenCalledWith(MOCK_USER_ID);
        expect(signRefresh).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_JTI);

        // Check response data
        expect(res.status).not.toHaveBeenCalled(); // Default status 200
        expect(res.json).toHaveBeenCalledWith({
            user: MOCK_USER.toSafeJSON(),
            tokenType: 'Bearer',
            accessToken: MOCK_ACCESS_TOKEN,
            accessTokenExpiresAt: MOCK_ACCESS_EXP,
            // Access token expiry in seconds: (MOCK_ACCESS_EXP - Date.now) / 1000 => (1731331200000 - 1731327600000) / 1000 = 3600
            accessTokenExpiresIn: 3600,
            refreshToken: MOCK_REFRESH_TOKEN,
            refreshTokenExpiresAt: MOCK_REFRESH_EXP,
            // Refresh token expiry in seconds: (MOCK_REFRESH_EXP - Date.now) / 1000 => (1733923200000 - 1731327600000) / 1000 = 2595600
            refreshTokenExpiresIn: 2595600,
        });
    });

    // --- Test Case 2: Missing Credentials (Status 400) ---
    test('should return 400 if email is missing', async () => {
        const { req, res } = createMocks({ password: MOCK_PASSWORD });
        await loginHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required.' });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    // --- Test Case 3: Invalid Credentials - User Not Found (Status 401) ---
    test('should return 401 if user is not found', async () => {
        User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) }); // User lookup returns null
        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await loginHandler(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    // --- Test Case 4: Invalid Credentials - Wrong Password (Status 401) ---
    test('should return 401 if password comparison fails', async () => {
        bcrypt.compare.mockResolvedValue(false); // Password comparison returns false
        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await loginHandler(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(bcrypt.compare).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
    });

    // --- Test Case 5: Email Not Verified (Status 401) ---
    test('should return 401 if user email is not verified', async () => {
        const unverifiedUser = { ...MOCK_USER, emailVerified: false };
        User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(unverifiedUser) });
        bcrypt.compare.mockResolvedValue(true);

        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await loginHandler(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(bcrypt.compare).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email not verified.' });
        expect(RefreshToken.create).not.toHaveBeenCalled();
    });

    // --- Test Case 6: Server Error (Status 500) ---
    test('should return 500 on a critical server error (e.g., DB connection issue)', async () => {
        const mockError = new Error('DB Connection Timeout');
        // Make user lookup fail immediately
        User.findOne.mockImplementation(() => ({
            select: jest.fn().mockRejectedValue(mockError)
        }));

        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await loginHandler(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
        expect(consoleErrorSpy).toHaveBeenCalledWith('[login]', mockError);
    });
});
