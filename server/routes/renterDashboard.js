const router = require('express').Router();
const authenticate = require('../middleware/auth');
const { renterOnly } = require('../middleware/auth');
const { getDashboard, getPayments, downloadReceipt } = require('../controllers/renterDashboardController');

router.use(authenticate, renterOnly);
router.get('/dashboard', getDashboard);
router.get('/payments', getPayments);
router.get('/payments/:id/receipt', downloadReceipt);

module.exports = router;
