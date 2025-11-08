const router = require('express').Router();

router.post('/', require('./postTransferRoute'));
router.get('/', require('./getTransfersRoute')); // All transfers
router.get('/filtered', require('./getFilteredTransfersRoute')); // Filtered transfers
router.put('/:id', require('./putTransferRoute'));
router.get('/:id', require('./getTransferByIdRoute'));
router.delete('/:id', require('./deleteTransferRoute'));

module.exports = router;