// const express = require('express');
// const router = express.Router();
// const { register, login, getMe } = require('../controllers/authController');
// const { protect } = require('../middlewares/auth');

// router.post('/register', register);
// router.post('/login', login);
// router.get('/me', protect, getMe);

// module.exports = router;
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;