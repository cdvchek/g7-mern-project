const router = require('express').Router();

router.post('/', require('./createTransferRoute'));
router.get('/', require('./getTransfersRoute')); // All transfers
router.get('/filtered', require('./getFilteredTransfersRoute')); // Filtered transfers

module.exports = router;