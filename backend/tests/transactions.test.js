// This test suite focuses on the 'GET /' route handler which fetches filtered transactions.

// --- Setup: Mocking Dependencies ---
const { Transaction } = require('../models'); // Assuming path is correct (../models)
const mongoose = require('mongoose');

// Mock the dependencies
jest.mock('../models', () => ({
    Transaction: {
        find: jest.fn(),
    },
}));

// Mock mongoose.Types.ObjectId.isValid
jest.mock('mongoose', () => ({
    Types: {
        ObjectId: {
            isValid: jest.fn(),
        },
    },
}));

// Mock the Transaction model's chained methods
const mockTransactions = [
    { _id: 't1', amount: 100, toSafeJSON: () => ({ id: 't1', amount: 100 }) },
    { _id: 't2', amount: 200, toSafeJSON: () => ({ id: 't2', amount: 200 }) },
];

const mockChainedQuery = {
    populate: jest.fn().mockResolvedValue(mockTransactions),
};

// Utility function to create mock req and res objects for the handler
const createMocks = (query = {}, userId = 'testUserId') => {
    const req = {
        userId: userId,
        query: query,
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    return { req, res };
};

// --- The Actual Route Handler (Isolated for Testing) ---
// NOTE: This represents the logic from your source file, extracted for unit testing.
const getTransactions = async (req, res) => {
    try {
        const { account_id, allocated, posted_before, posted_after, merchant_name, category } = req.query;

        // Build filter object
        const filter = { user_id: req.userId };

        if (account_id) {
            // NOTE: Must use the mocked mongoose.Types.ObjectId.isValid here
            if (!mongoose.Types.ObjectId.isValid(account_id)) return res.status(400).json({ error: 'Invalid account_id' });
            filter.account_id = account_id;
        }

        if (typeof allocated !== 'undefined') {
            filter.allocated = allocated === 'true' || allocated === '1' || allocated === true;
        }

        if (merchant_name) {
            filter.merchant_name = { $regex: merchant_name, $options: 'i' };
        }

        if (category) {
            filter.category = category;
        }

        if (posted_before || posted_after) {
            filter.posted_at = {};
            if (posted_before) {
                const d = new Date(posted_before);
                if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_before date' });
                filter.posted_at.$lte = d;
            }
            if (posted_after) {
                const d = new Date(posted_after);
                if (isNaN(d.getTime())) return res.status(400).json({ error: 'Invalid posted_after date' });
                filter.posted_at.$gte = d;
            }
        }

        // Fetch transactions (using the mocked chainable find)
        const transactions = await Transaction.find(filter).populate('account_id', 'name');

        return res.status(200).json({ transactions: transactions.map(t => t.toSafeJSON()) });
    } catch (error) {
        // This log will be silenced by the console.error mock
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};


describe('GET / Transaction Route Handler (Filtering)', () => {
    const MOCK_USER_ID = 'user123';
    const VALID_ACCOUNT_ID = '60c72b2f9c1825001c22d1f2';
    
    // --- Console Error Mocking ---
    let consoleErrorSpy;
    let originalNodeEnv;

    beforeAll(() => {
        // Mock console.error to prevent noise from the 500 test
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        originalNodeEnv = process.env.NODE_ENV;
    });

    afterAll(() => {
        // Restore console.error
        consoleErrorSpy.mockRestore();
        process.env.NODE_ENV = originalNodeEnv;
    });
    // -----------------------------

    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure Transaction.find returns the mock chainable object before each test
        Transaction.find.mockReturnValue(mockChainedQuery);
        mockChainedQuery.populate.mockResolvedValue(mockTransactions);
        // Default valid object ID for most success cases
        mongoose.Types.ObjectId.isValid.mockReturnValue(true);
        process.env.NODE_ENV = 'production'; // Default environment
    });

    // --- Test Case 1: Success - No Filters ---
    test('should return 200 and all transactions for the user when no filters are provided', async () => {
        const { req, res } = createMocks({}, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        expect(Transaction.find).toHaveBeenCalledWith({ user_id: MOCK_USER_ID });
        expect(mockChainedQuery.populate).toHaveBeenCalledWith('account_id', 'name');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            transactions: mockTransactions.map(t => t.toSafeJSON())
        });
    });

    // --- Test Case 2: Success - All Filters Combined ---
    test('should construct a complex filter when all valid parameters are provided', async () => {
        const query = {
            account_id: VALID_ACCOUNT_ID,
            allocated: 'true',
            posted_before: '2023-12-31',
            posted_after: '2023-01-01',
            merchant_name: 'Starbucks',
            category: 'Coffee',
        };

        const { req, res } = createMocks(query, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        const findCall = Transaction.find.mock.calls[0][0];

        expect(findCall.user_id).toBe(MOCK_USER_ID);
        expect(findCall.account_id).toBe(VALID_ACCOUNT_ID);
        expect(findCall.allocated).toBe(true); // check string 'true' conversion
        expect(findCall.merchant_name).toEqual({ $regex: 'Starbucks', $options: 'i' }); // check regex
        expect(findCall.category).toBe('Coffee');

        // Check date objects
        expect(findCall.posted_at.$lte).toBeInstanceOf(Date);
        expect(findCall.posted_at.$gte).toBeInstanceOf(Date);
        expect(findCall.posted_at.$lte.toISOString().startsWith('2023-12-31')).toBe(true);
        expect(findCall.posted_at.$gte.toISOString().startsWith('2023-01-01')).toBe(true);
        
        expect(res.status).toHaveBeenCalledWith(200);
    });
    
    // --- Test Case 3: Success - Allocated String '0' (False) ---
    test('should set allocated filter to false when allocated=0', async () => {
        const query = { allocated: '0' };
        const { req, res } = createMocks(query, MOCK_USER_ID);
        await getTransactions(req, res);
        
        const findCall = Transaction.find.mock.calls[0][0];
        expect(findCall.allocated).toBe(false);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // --- Test Case 4: Error - Invalid account_id (Status 400) ---
    test('should return 400 if account_id is invalid ObjectId format', async () => {
        mongoose.Types.ObjectId.isValid.mockReturnValue(false);
        const query = { account_id: 'bad-id-format' };
        
        const { req, res } = createMocks(query, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('bad-id-format');
        expect(Transaction.find).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid account_id' });
    });
    
    // --- Test Case 5: Error - Invalid posted_before date (Status 400) ---
    test('should return 400 if posted_before date is invalid', async () => {
        const query = { posted_before: 'not-a-date' };
        
        const { req, res } = createMocks(query, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid posted_before date' });
    });

    // --- Test Case 6: Error - Database Failure (Status 500) ---
    test('should return 500 on a database failure and hide details in production', async () => {
        process.env.NODE_ENV = 'production';
        const mockDbError = new Error('Simulated DB failure');
        
        // Mock the entire chain to reject
        Transaction.find.mockImplementation(() => ({
            populate: jest.fn().mockRejectedValue(mockDbError)
        }));

        const { req, res } = createMocks({}, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Failed to fetch transactions',
            details: undefined // Hidden in production
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching transactions:', mockDbError);
    });

    // --- Test Case 7: Error - Database Failure (Status 500) - Development Mode ---
    test('should return 500 and expose details in development mode', async () => {
        process.env.NODE_ENV = 'development';
        const mockDbError = new Error('Simulated DB failure');
        
        // Mock the entire chain to reject
        Transaction.find.mockImplementation(() => ({
            populate: jest.fn().mockRejectedValue(mockDbError)
        }));

        const { req, res } = createMocks({}, MOCK_USER_ID);
        await getTransactions(req, res);

        // Assertions
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Failed to fetch transactions',
            details: 'Simulated DB failure' // Exposed in development
        });
    });
});
