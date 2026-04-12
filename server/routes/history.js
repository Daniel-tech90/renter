const router = require('express').Router();
const auth = require('../middleware/auth');
const { getHistory, getTenantDetails } = require('../controllers/historyController');

router.use(auth);
router.get('/', getHistory);
router.get('/tenant/:id', getTenantDetails);

module.exports = router;
