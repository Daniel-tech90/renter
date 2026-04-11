const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, getOne, create, update, remove, markLeft } = require('../controllers/renterController');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.put('/:id/mark-left', markLeft);

module.exports = router;
