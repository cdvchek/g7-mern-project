// Routes the envelope get requests
const router = require('express').Router();
const requireAuth = require('../../middleware/requireAuth');
const { Transaction } = require('../../models');
const { plaid } = require("../../connection/plaid")

router.post('/', requireAuth, async (req, res) => {

    //asdas

})


router.get('/', requireAuth, async (req, res) => { // Added requireAuth for the specific route


});

// Get a specific envelope by ID
router.get('/:id', async (req, res) => {

}); 

/// End of file dont write after
module.exports = router;