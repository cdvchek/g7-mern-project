// --- Setup: Mocking Dependencies ---
const { BankConnection, Account } = require('../models');

// Mock models
jest.mock('../models', () => ({
    BankConnection: {
        find: jest.fn(),
        findOne: jest.fn(),
    },
    Account: {
        find: jest.fn(),
    },
}));

// Mock Mongoose chainable methods for find (used in both models)
const mockFindChain = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn(),
};

// Utility function to create mock req and res objects
const createMocks = (params = {}, userId = 'testUserId') => {
    const req = {
        userId: userId,
        params: params,
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    return { req, res };
};

// --- Route Handlers (Isolated for Testing) ---
// Note: In a real environment, these handlers would be imported from the router file.

// GET /api/banks/
const listConnectionsHandler = async (req, res) => {
    try {
        const conns = await BankConnection.find({ userId: req.userId, removed: { $ne: true } })
            .sort({ createdAt: -1 })
            .lean();

        return res.json(conns.map(c => ({
            id: String(c._id),
            item_id: c.item_id,
            institution_name: c.institution_name,
            institution_id: c.institution_id,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        })));
    } catch (error) {
        console.error('Error listing bank connections:', error);
        return res.status(500).json({ error: 'Failed to fetch bank connections' });
    }
};

// GET /api/banks/:itemId/accounts
const listAccountsHandler = async (req, res) => {
    try {
        const { itemId } = req.params;

        const conn = await BankConnection.findOne({
            userId: req.userId,
            item_id: itemId,
            removed: { $ne: true },
        }).lean();

        if (!conn) return res.status(404).json({ error: 'bank_connection_not_found' });

        const accounts = await Account.find({ user_id: req.userId, plaid_item_id: itemId })
            .sort({ name: 1 })
            .lean();

        return res.json(accounts.map(a => ({
            id: String(a._id),
            plaid_account_id: a.plaid_account_id,
            name: a.name,
            official_name: a.official_name,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
            balance_current: a.balance_current,
            tracking: !!a.tracking,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        })));
    } catch (error) {
        console.error('Error listing accounts:', error);
        return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
};

// --- Mock Data ---
const MOCK_USER_ID = 'user-abc-123';
const MOCK_ITEM_ID = 'plaid-item-xyz';
const MOCK_DATE = new Date('2024-01-01T00:00:00.000Z');

const MOCK_CONNECTIONS_DATA = [
    {
        _id: 'conn1',
        item_id: MOCK_ITEM_ID,
        institution_name: 'Chase Bank',
        institution_id: 'ins_123',
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
    },
];

const MOCK_ACCOUNTS_DATA = [
    {
        _id: 'acc1',
        plaid_account_id: 'plaid-acc-1',
        name: 'Checking',
        official_name: 'Checking Account',
        mask: '1111',
        type: 'depository',
        subtype: 'checking',
        balance_current: 500.50,
        tracking: true,
        user_id: MOCK_USER_ID,
        plaid_item_id: MOCK_ITEM_ID,
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
    },
    {
        _id: 'acc2',
        plaid_account_id: 'plaid-acc-2',
        name: 'Savings',
        official_name: 'Savings Account',
        mask: '2222',
        type: 'depository',
        subtype: 'savings',
        balance_current: 12000.00,
        tracking: false,
        user_id: MOCK_USER_ID,
        plaid_item_id: MOCK_ITEM_ID,
        createdAt: MOCK_DATE,
        updatedAt: MOCK_DATE,
    },
];

// --- Console Error Mocking ---
let consoleErrorSpy;

beforeAll(() => {
    // Spy on console.error to prevent log noise from 500 tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    // Restore the original console.error implementation
    consoleErrorSpy.mockRestore();
});
// -----------------------------

describe('Bank Route Handlers', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset Mongoose chain mocks for find
        BankConnection.find.mockReturnValue(mockFindChain);
        Account.find.mockReturnValue(mockFindChain);
    });

    // ==========================================================
    // GET / (List Connections)
    // ==========================================================
    describe('GET / (List Connections)', () => {
        // --- Test Case 1: Success - Connections Found (Status 200) ---
        test('should return 200 and a list of connections for the user', async () => {
            // Setup Mocks
            mockFindChain.lean.mockResolvedValue(MOCK_CONNECTIONS_DATA);

            // Execute
            const { req, res } = createMocks({}, MOCK_USER_ID);
            await listConnectionsHandler(req, res);

            // Assertions
            expect(BankConnection.find).toHaveBeenCalledWith({
                userId: MOCK_USER_ID,
                removed: { $ne: true },
            });
            expect(mockFindChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

            // Check response format
            expect(res.json).toHaveBeenCalledWith([
                {
                    id: 'conn1',
                    item_id: MOCK_ITEM_ID,
                    institution_name: 'Chase Bank',
                    institution_id: 'ins_123',
                    createdAt: MOCK_DATE,
                    updatedAt: MOCK_DATE,
                },
            ]);
            expect(res.status).not.toHaveBeenCalled();
        });

        // --- Test Case 2: Success - No Connections Found (Status 200, empty array) ---
        test('should return 200 and an empty array if no connections are found', async () => {
            // Setup Mocks
            mockFindChain.lean.mockResolvedValue([]);

            // Execute
            const { req, res } = createMocks({}, MOCK_USER_ID);
            await listConnectionsHandler(req, res);

            // Assertions
            expect(res.json).toHaveBeenCalledWith([]);
            expect(res.status).not.toHaveBeenCalled();
        });

        // --- Test Case 3: Internal Server Error (Status 500) ---
        test('should return 500 on a database error', async () => {
            const mockDbError = new Error('Connection DB failure');
            // Mock the lean call to reject
            mockFindChain.lean.mockRejectedValue(mockDbError);

            // Execute
            const { req, res } = createMocks({}, MOCK_USER_ID);
            await listConnectionsHandler(req, res);

            // Assertions
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch bank connections' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error listing bank connections:', mockDbError);
        });
    });

    // ==========================================================
    // GET /:itemId/accounts (List Accounts)
    // ==========================================================
    describe('GET /:itemId/accounts (List Accounts)', () => {
        const MOCK_CONNECTION_INSTANCE = {
            item_id: MOCK_ITEM_ID,
            institution_name: 'Chase Bank',
        };

        // --- Test Case 4: Success - Accounts Found (Status 200) ---
        test('should return 200 and a list of accounts for a valid connection', async () => {
            // Setup Mocks
            BankConnection.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(MOCK_CONNECTION_INSTANCE) });
            mockFindChain.lean.mockResolvedValue(MOCK_ACCOUNTS_DATA);

            // Execute
            const { req, res } = createMocks({ itemId: MOCK_ITEM_ID }, MOCK_USER_ID);
            await listAccountsHandler(req, res);

            // Assertions
            // 1. Check BankConnection lookup
            expect(BankConnection.findOne).toHaveBeenCalledWith({
                userId: MOCK_USER_ID,
                item_id: MOCK_ITEM_ID,
                removed: { $ne: true },
            });

            // 2. Check Account lookup
            expect(Account.find).toHaveBeenCalledWith({
                user_id: MOCK_USER_ID,
                plaid_item_id: MOCK_ITEM_ID,
            });
            expect(mockFindChain.sort).toHaveBeenCalledWith({ name: 1 });

            // 3. Check response format
            expect(res.json).toHaveBeenCalledWith(
                MOCK_ACCOUNTS_DATA.map(a => ({
                    id: String(a._id),
                    plaid_account_id: a.plaid_account_id,
                    name: a.name,
                    official_name: a.official_name,
                    mask: a.mask,
                    type: a.type,
                    subtype: a.subtype,
                    balance_current: a.balance_current,
                    tracking: !!a.tracking, // Should be correctly cast to boolean
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt,
                }))
            );
            expect(res.status).not.toHaveBeenCalled();
        });

        // --- Test Case 5: Failure - Connection Not Found (Status 404) ---
        test('should return 404 if the bank connection is not found', async () => {
            // Setup Mocks
            BankConnection.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

            // Execute
            const { req, res } = createMocks({ itemId: MOCK_ITEM_ID }, MOCK_USER_ID);
            await listAccountsHandler(req, res);

            // Assertions
            expect(BankConnection.findOne).toHaveBeenCalledTimes(1);
            expect(Account.find).not.toHaveBeenCalled(); // Should short-circuit
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'bank_connection_not_found' });
        });

        // --- Test Case 6: Success - No Accounts Found (Status 200, empty array) ---
        test('should return 200 and an empty array if connection found but no accounts exist', async () => {
            // Setup Mocks
            BankConnection.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(MOCK_CONNECTION_INSTANCE) });
            mockFindChain.lean.mockResolvedValue([]); // No accounts returned

            // Execute
            const { req, res } = createMocks({ itemId: MOCK_ITEM_ID }, MOCK_USER_ID);
            await listAccountsHandler(req, res);

            // Assertions
            expect(BankConnection.findOne).toHaveBeenCalledTimes(1);
            expect(Account.find).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith([]);
            expect(res.status).not.toHaveBeenCalled();
        });

        // --- Test Case 7: Internal Server Error (Status 500) ---
        test('should return 500 on a database error during account lookup', async () => {
            const mockDbError = new Error('Account DB failure');
            // Mock connection lookup success
            BankConnection.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(MOCK_CONNECTION_INSTANCE) });
            // Mock account lookup failure
            mockFindChain.lean.mockRejectedValue(mockDbError);

            // Execute
            const { req, res } = createMocks({ itemId: MOCK_ITEM_ID }, MOCK_USER_ID);
            await listAccountsHandler(req, res);

            // Assertions
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch accounts' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error listing accounts:', mockDbError);
        });
    });
});
