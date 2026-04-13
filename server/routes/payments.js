const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAll, getByRenter, getLastReading, getYearlySummary, create, update,
  generateReceipt, generateBill, submitScreenshot, approvePayment, rejectPayment, sendMessage
} = require('../controllers/paymentController');

router.use(auth);
router.get('/', getAll);
router.get('/yearly-summary', getYearlySummary);
router.get('/renter/:renterId/last-reading', getLastReading);
router.get('/renter/:renterId/advance', async (req, res) => {
  try {
    const Renter = require('../models/Renter');
    const r = await Renter.findOne({ _id: req.params.renterId, adminId: req.adminId }).select('advanceBalance name');
    if (!r) return res.status(404).json({ message: 'Renter not found' });
    res.json({ advanceBalance: r.advanceBalance || 0, name: r.name });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/renter/:renterId', getByRenter);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/screenshot', upload.single('screenshot'), submitScreenshot);
router.post('/:id/approve', approvePayment);
router.post('/:id/reject', rejectPayment);
router.post('/:id/send-message', sendMessage);
router.get('/:id/receipt', generateReceipt);
router.get('/:id/bill', generateBill);

module.exports = router;
