const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, getOne, create, update, markPaid, remove, generateReceipt, sendWhatsApp } = require('../controllers/billingController');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.put('/:id/mark-paid', markPaid);
router.delete('/:id', remove);
router.get('/:id/receipt', generateReceipt);
router.post('/:id/whatsapp', sendWhatsApp);

module.exports = router;
