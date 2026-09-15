const { Router } = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../utils/async-handler');

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', verifyToken, asyncHandler(me));

module.exports = router;
