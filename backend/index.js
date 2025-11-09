// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectMongoose = require('./connection/mongoose');
const routes = require('./controllers');

const startServer = async () => {
    await connectMongoose();

    const app = express();

    // Use 0.0.0.0 so phones/emulators can hit your machine over LAN
    const HOST = process.env.HOST || '0.0.0.0';
    const PORT = Number(process.env.PORT || 3001);

    // Body parsers
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));

    // CORS (no credentials because we’re not using cookies)
    const corsAnyOrigin = {
        origin: (_origin, cb) => cb(null, true), // allow all in dev
        credentials: false,                      // <-- important: no cookies
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 204,
    };
    app.use(cors(corsAnyOrigin));

    // Preflight helper for Express 5
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') return res.sendStatus(204);
        next();
    });

    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }

    // Optional: simple health check
    app.get('/healthz', (_req, res) => res.json({ ok: true }));

    // Mount API
    app.use('/api', routes);

    // 404s
    app.use((req, res, _next) => {
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

    app.listen(PORT, HOST, () => {
        console.log(`API listening on http://${HOST}:${PORT}`);
    });
};

startServer();