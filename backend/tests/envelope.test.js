// This test suite assumes the handler function for router.get('/:id') is exported or accessible.
// For the purpose of this unit test, we will assume the route handler logic is inside an
// exported function named `getEnvelopeById`. If you cannot refactor to export it,
// you would use a tool like Supertest to test the Express route endpoint itself.

// --- Setup: Mocking Dependencies ---
const { Envelope } = require('../models'); // Mock the model import
const mongoose = require('mongoose');

// Mock the dependencies
jest.mock('../models', () => ({
    Envelope: {
        findOne: jest.fn(),
    },
}));

// We need to mock mongoose.Types.ObjectId.isValid to control its return value
jest.mock('mongoose', () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn(),
        },
    },
}));

// Utility function to create mock req and res objects for the handler
const createMocks = (body = {}, params = {}, userId = 'testUserId') => {
    const req = {
        userId: userId,
        params: params,
        body: body,
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    return { req, res };
};

// --- The Actual Route Handler (Isolated for Testing) ---
// NOTE: Since the handler is inside your file, you'll need to refactor your
// source file to export this function directly for true unit testing.
// For demonstration purposes, this mock function represents the logic you provided:
const getEnvelopeById = async (req, res) => {
    try {
        const userId = req.userId;
        const envelopeId = req.params.id;

        // 1. Validate envelopeId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(envelopeId)) {
            return res.status(400).json({ error: 'Invalid envelope ID' });
        }

        // 2. Find the envelope belonging to the user
        const envelope = await Envelope.findOne({ _id: envelopeId, user_id: userId });

        // 3. if there is no envelope found return error 404
        if (!envelope) {
            return res.status(404).json({ error: 'Envelope not found' });
        }

        // 4. Return the safe JSON representation of the envelope
        return res.json(envelope.toSafeJSON());
    } catch (error) {
        // This is the line that generates the console output
        console.error("Error getting the envelope:", error); 
        return res.status(500).json({ error: 'Internal error could not grab envelope' });
    }
};

describe('GET /:id Envelope Route Handler', () => {
    const MOCK_USER_ID = 'testUserId123';
    const MOCK_ENVELOPE_ID = '60c72b2f9c1825001c22d1f1'; // A valid-looking ID

    // --- Add console.error mocking to prevent log noise from the 500 test ---
    let consoleErrorSpy;
    
    beforeAll(() => {
        // Spy on console.error and mock its implementation before any tests run
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        // Restore the original console.error implementation after all tests in the suite
        consoleErrorSpy.mockRestore();
    });
    // --------------------------------------------------------------------------

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Test Case 1: Success (Status 200) ---
    test('should return 200 and the safe JSON of the envelope if found', async () => {
        // Setup Mocks
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);

        const mockEnvelope = {
            name: 'Rent',
            amount: 500,
            _id: MOCK_ENVELOPE_ID,
            user_id: MOCK_USER_ID,
            toSafeJSON: jest.fn().mockReturnValue({ id: MOCK_ENVELOPE_ID, name: 'Rent' }),
        };

        Envelope.findOne.mockResolvedValue(mockEnvelope);

        // Execute
        const { req, res } = createMocks({}, { id: MOCK_ENVELOPE_ID }, MOCK_USER_ID);
        await getEnvelopeById(req, res);

        // Assertions
        expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(MOCK_ENVELOPE_ID);
        expect(Envelope.findOne).toHaveBeenCalledWith({
            _id: MOCK_ENVELOPE_ID,
            user_id: MOCK_USER_ID,
        });
        expect(res.json).toHaveBeenCalledWith({ id: MOCK_ENVELOPE_ID, name: 'Rent' });
        expect(res.status).not.toHaveBeenCalled(); // Successful requests don't call status() before json()
    });

    // --- Test Case 2: Invalid ID (Status 400) ---
    test('should return 400 if the envelope ID is invalid', async () => {
        // Setup Mocks
        const INVALID_ID = '12345';
        mongoose.Types.ObjectId.isValid.mockReturnValue(false); // ID validation fails

        // Execute
        const { req, res } = createMocks({}, { id: INVALID_ID }, MOCK_USER_ID);
        await getEnvelopeById(req, res);

        // Assertions
        expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(INVALID_ID);
        expect(Envelope.findOne).not.toHaveBeenCalled(); // Database should not be queried
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid envelope ID' });
    });

    // --- Test Case 3: Envelope Not Found (Status 404) ---
    test('should return 404 if the envelope is not found (or does not belong to user)', async () => {
        // Setup Mocks
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        Envelope.findOne.mockResolvedValue(null); // Database finds nothing

        // Execute
        const { req, res } = createMocks({}, { id: MOCK_ENVELOPE_ID }, MOCK_USER_ID);
        await getEnvelopeById(req, res);

        // Assertions
        expect(Envelope.findOne).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Envelope not found' });
    });

    // --- Test Case 4: Internal Server Error (Status 500) ---
    test('should return 500 if a database error occurs during findOne', async () => {
        // Setup Mocks
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        const mockDbError = new Error('Simulated DB failure');
        Envelope.findOne.mockRejectedValue(mockDbError); // DB query rejects

        // Execute
        const { req, res } = createMocks({}, { id: MOCK_ENVELOPE_ID }, MOCK_USER_ID);
        await getEnvelopeById(req, res);

        // Assertions
        expect(Envelope.findOne).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal error could not grab envelope' });
        // Optional: Assert that console.error was actually called during this test
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error getting the envelope:", mockDbError);
    });
});
