const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAll, getByRenter, create, update,
  generateReceipt, submitScreenshot, approvePayment, rejectPayment, sendMessage
} = require('../controllers/paymentController');

router.use(auth);
router.get('/', getAll);
router.get('/renter/:renterId', getByRenter);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/screenshot', upload.single('screenshot'), submitScreenshot);
router.post('/:id/approve', approvePayment);
router.post('/:id/reject', rejectPayment);
router.post('/:id/send-message', sendMessage);
router.get('/:id/receipt', generateReceipt);

module.exports = router;
