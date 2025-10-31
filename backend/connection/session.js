const MongoStore = require('connect-mongo');

const sess = {
    name: process.env.SESSION_NAME || 'session_id',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours (milliseconds)
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 60 * 60 * 2, // 2 hours (seconds)
    }),
};

module.exports = sess;