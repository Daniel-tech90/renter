const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getAll, getOne, create, update, remove, markLeft, uploadGovtId } = require('../controllers/renterController');

router.use(auth);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.put('/:id/mark-left', markLeft);
router.post('/:id/upload-id', upload.single('govtId'), uploadGovtId);

module.exports = router;
