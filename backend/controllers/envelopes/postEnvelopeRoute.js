const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Envelope } = require('../../models');

//router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const { name, color, amount, order } = req.body;

    // Now we have to Validate string is not empty and nums are ints greater than or equal to 0
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Name is not string and name is empty" });
    }

    // Parse the integers to assure that we are recieving numbers
    const parsedAmount = Number(amount);
    const parsedOrder = Number(order);

    // Valiadate value is int and greater than or equal to 0
    if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Amount is not receiving an integer and is less than 0" });
    }

    // Validate value is int and greater than or equal to 0
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
        return res.status(400).json({ error: "Order is not receiving an integer and is less than 0" });
    }

    // Create the envelope
    const payload = {
        user_id: req.session.userId,
        name,
        color: color || '',
        amount: parsedAmount,
        order: parsedOrder,
    }

    // Create the envelope in the database
    const envelope = await Envelope.create(payload);
    
    // Return the safe JSON representation of the envelope
    return res.status(201).json(envelope.toSafeJSON());

    // If there is an error it will be caught and handled below
  } catch (error) {
    console.error("Error creating envelope:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
 
module.exports = router;
