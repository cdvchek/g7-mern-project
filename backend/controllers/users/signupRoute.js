const express = require('express');
const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err});
    }
})