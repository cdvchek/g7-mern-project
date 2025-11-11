// --- Setup: Mocking Dependencies ---
// Adjusting paths for the 'tests/' directory structure:
const { User } = require('../models');
const { sendMail } = require('../util/resend');
const { createToken, hashToken } = require('../util/crypto');

// Mock dependencies
jest.mock('../models', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));

// FIX: Explicitly mock the implementation of the util/resend module.
// This prevents the actual file from being loaded, which would otherwise fail
// immediately due to Resend client initialization requiring an API key.
jest.mock('../util/resend', () => ({
    sendMail: jest.fn(),
}));
// Original mock (if it existed) was too implicit and Jest still tried to run the file:
// jest.mock('../util/resend'); 

jest.mock('../util/crypto');

// Utility function to create mock req and res objects
const createMocks = (body = {}) => {
    const req = {
        body: body,
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    return { req, res };
};

// --- The Actual Route Handler (Isolated for Testing) ---
// NOTE: This represents the logic from your source file, extracted for unit testing.
const registerHandler = async (req, res) => {
    // Get mocked environment variables. In a real app, this is global process.env
    const TOKEN_TTL_MIN = Number(process.env.EMAIL_TOKEN_TTL_MINUTES);

    try {
        const { email, password, name, timezone, currency } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const normEmail = String(email).trim().toLowerCase();

        // 1. Check if user exists
        const exists = await User.findOne({ email: normEmail }).lean(); 
        if (exists) {
            return res.status(409).json({ error: "Email already in use." });
        }

        // 2. Create user (passwordHash is assumed to be handled by Mongoose pre-save hook)
        const user = await User.create({
            email: normEmail,
            passwordHash: password, // Mongoose/model should hash this
            name: name?.trim() || '',
            timezone: timezone,
            currency: currency,
        });

        // 3. Generate and set token
        const raw = createToken();
        user.emailVerifyTokenHash = hashToken(raw);
        user.emailVerifyTokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
        await user.save();

        // 4. Send verification email
        const verifyUrl = `${process.env.APP_URL}/verify_email?token=${raw}&email=${encodeURIComponent(email)}`;

        await sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Verify your email: ${verifyUrl}`,
            html: `
                <p>Welcome${name ? ', ' + name : ''}!</p>
                <p>Confirm your email address to finish setting up your account.</p>
                <p><a href="${verifyUrl}">Verify Email</a></p>
                <p>This link expires in ${TOKEN_TTL_MIN} minutes.</p>
            `,
        });

        // 5. Success response
        return res.status(201).json({ user: user.toSafeJSON() });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
};


describe('POST / Register Route Handler', () => {
    const MOCK_PASSWORD = 'strongPassword123';
    const MOCK_EMAIL = 'john.doe@test.com';
    const MOCK_NAME = 'John Doe';
    const MOCK_TIMEZONE = 'America/New_York';
    const MOCK_CURRENCY = 'USD';

    // Mock constants
    const MOCK_TTL_MIN = 60;
    const MOCK_APP_URL = 'http://localhost:3000';
    const MOCK_RAW_TOKEN = 'raw-test-token';
    const MOCK_HASHED_TOKEN = 'hashed-test-token';
    
    // Fixed time for Date.now() to ensure expiration calculation is consistent
    const MOCK_DATE_NOW = 1731327600000; // Epoch ms: Nov 10, 2025 09:00:00 UTC
    const MOCK_TOKEN_EXP = new Date(MOCK_DATE_NOW + MOCK_TTL_MIN * 60 * 1000); // 1731331200000

    // Mock User object structure
    let mockUserInstance;
    
    // --- Console Log/Error Mocking ---
    let consoleLogSpy;
    let originalDateNow;

    beforeAll(() => {
        // Mock console.log for error catching
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Mock Date.now()
        originalDateNow = Date.now;
        global.Date.now = jest.fn(() => MOCK_DATE_NOW);
    });

    afterAll(() => {
        // Restore mocks
        consoleLogSpy.mockRestore();
        global.Date.now = originalDateNow;
    });
    // -----------------------------

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Environment Variables
        process.env.EMAIL_TOKEN_TTL_MINUTES = MOCK_TTL_MIN;
        process.env.APP_URL = MOCK_APP_URL;

        // Mock utility return values
        createToken.mockReturnValue(MOCK_RAW_TOKEN);
        hashToken.mockReturnValue(MOCK_HASHED_TOKEN);

        // Mock User Instance for `User.create` (including the required save method)
        mockUserInstance = {
            _id: 'newUserId',
            email: MOCK_EMAIL,
            passwordHash: MOCK_PASSWORD,
            name: MOCK_NAME,
            timezone: MOCK_TIMEZONE,
            currency: MOCK_CURRENCY,
            toSafeJSON: jest.fn().mockReturnValue({ id: 'newUserId', email: MOCK_EMAIL, name: MOCK_NAME }),
            save: jest.fn().mockResolvedValue(true), 
        };

        // Default mock setup: User does not exist
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
        // Mock the User creation returning the instance
        User.create.mockResolvedValue(mockUserInstance);
    });

    // --- Test Case 1: Full Success (Status 201) ---
    test('should return 201, create user, save token, and send email on success', async () => {
        const body = {
            email: MOCK_EMAIL,
            password: MOCK_PASSWORD,
            name: MOCK_NAME,
            timezone: MOCK_TIMEZONE,
            currency: MOCK_CURRENCY,
        };
        const { req, res } = createMocks(body);
        await registerHandler(req, res);

        // 1. Check database existence query (should use normalized email)
        expect(User.findOne).toHaveBeenCalledWith({ email: MOCK_EMAIL });

        // 2. Check user creation
        expect(User.create).toHaveBeenCalledWith({
            email: MOCK_EMAIL,
            passwordHash: MOCK_PASSWORD,
            name: MOCK_NAME,
            timezone: MOCK_TIMEZONE,
            currency: MOCK_CURRENCY,
        });

        // 3. Check token generation and saving
        expect(createToken).toHaveBeenCalledTimes(1);
        expect(hashToken).toHaveBeenCalledWith(MOCK_RAW_TOKEN);
        expect(mockUserInstance.emailVerifyTokenHash).toBe(MOCK_HASHED_TOKEN);
        expect(mockUserInstance.emailVerifyTokenExp).toEqual(MOCK_TOKEN_EXP);
        expect(mockUserInstance.save).toHaveBeenCalledTimes(1);

        // 4. Check email sending details
        const expectedVerifyUrl = `${MOCK_APP_URL}/verify_email?token=${MOCK_RAW_TOKEN}&email=${encodeURIComponent(MOCK_EMAIL)}`;
        expect(sendMail).toHaveBeenCalledWith({
            to: MOCK_EMAIL,
            subject: 'Verify your email',
            text: `Verify your email: ${expectedVerifyUrl}`,
            html: expect.stringContaining(`<a href="${expectedVerifyUrl}">Verify Email</a>`),
        });

        // 5. Check final response
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ user: mockUserInstance.toSafeJSON() });
    });

    // --- Test Case 2: Success with minimal required fields (Status 201) ---
    test('should succeed with only email and password, setting default empty values', async () => {
        const body = { email: MOCK_EMAIL, password: MOCK_PASSWORD };
        
        // Adjust mock instance for default name
        User.create.mockResolvedValue({
            ...mockUserInstance,
            name: '',
            toSafeJSON: jest.fn().mockReturnValue({ id: 'newUserId', email: MOCK_EMAIL, name: '' }),
        });

        const { req, res } = createMocks(body);
        await registerHandler(req, res);

        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
            name: '',
            timezone: undefined,
            currency: undefined,
        }));
        
        expect(res.status).toHaveBeenCalledWith(201);
    });


    // --- Test Case 3: Failure - Missing Password (Status 400) ---
    test('should return 400 if password is missing', async () => {
        const { req, res } = createMocks({ email: MOCK_EMAIL });
        await registerHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required.' });
        expect(User.findOne).not.toHaveBeenCalled();
    });

    // --- Test Case 4: Failure - Email Already In Use (Status 409) ---
    test('should return 409 if user already exists', async () => {
        // Setup: User.findOne returns an existing user object
        User.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'existingId' }) });
        
        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await registerHandler(req, res);

        expect(User.findOne).toHaveBeenCalledTimes(1);
        expect(User.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use.' });
    });

    // --- Test Case 5: Failure - Server Error during User Creation (Status 500) ---
    test('should return 500 on a database error during creation', async () => {
        const mockError = new Error('Database write failed');
        User.create.mockRejectedValue(mockError);

        const { req, res } = createMocks({ email: MOCK_EMAIL, password: MOCK_PASSWORD });
        await registerHandler(req, res);

        expect(User.create).toHaveBeenCalledTimes(1);
        expect(sendMail).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: mockError });
    });
});
