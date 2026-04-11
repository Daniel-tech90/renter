const router = require('express').Router();
const auth = require('../middleware/auth');
const { getHistory } = require('../controllers/historyController');

router.use(auth);
router.get('/', getHistory);

module.exports = router;
