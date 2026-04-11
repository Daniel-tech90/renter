const router = require('express').Router();
const { login, renterLogin } = require('../controllers/authController');

router.post('/login', login);
router.post('/renter-login', renterLogin);

module.exports = router;
