// Core & Utils
// =============================================================
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

// Routes
const routes = require('./controllers');

// App Setup
// =============================================================
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || 'http://localhost:3000',
        credentials: true,
    })
);

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// MongoDB (Mongoose) Connection
// =============================================================
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myapp';
mongoose.set('strictQuery', true);

mongoose
    .connect(mongoUri, {
        // options here if needed
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Sessions (stored in MongoDB)
// =============================================================
const sess = {
    name: process.env.SESSION_NAME || 'sid',
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours (milliseconds)
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
    store: MongoStore.create({
        mongoUrl: process.env.SESSION_NAME,
        collectionName: 'sessions',
        ttl: 60 * 60 * 2, // 2 hours (seconds)
    }),
};
app.use(session(sess));

// API Routes
// =============================================================
app.use('/api', routes);

// Simple health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// 404 handler (API)
app.use((req, res, _next) => {
    console.log(req);
    
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.status(404).send('Not found');
});

// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
});

// Start
// =============================================================
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
