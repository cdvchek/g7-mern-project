require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const connectMongoose = require("./connection/mongoose");
const routes = require('./controllers');

const startServer = async () => {
    await connectMongoose();
    const sess = require('./connection/session');

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

    app.use(session(sess));
    app.use('/api', routes);
    app.use((req, res, _next) => {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.status(404).send('Not found');
    });
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    });

    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

startServer();