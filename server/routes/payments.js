const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, getByRenter, create, update, generateReceipt } = require('../controllers/paymentController');

router.use(auth);
router.get('/', getAll);
router.get('/renter/:renterId', getByRenter);
router.get('/:id/receipt', generateReceipt);
router.post('/', create);
router.put('/:id', update);

module.exports = router;
