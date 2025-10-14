const express = require('express');
const { registerUser, loginUser, logoutUser, deleteUser, getMyUserInfo, getUserPublicInfoByEmail, updateUserInfo, googleUserAuth } = require('../controllers/userController');
const auth = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/register', upload.fields([
    { name: 'profilePicture', maxCount: 1}, // Optional profile picture upload
]), registerUser);
router.post('/google-auth', googleUserAuth);
router.put('/login', loginUser);
router.put('/logout', logoutUser);
router.delete('/delete', deleteUser);
router.get('/me', getMyUserInfo);
router.put('/', upload.fields([
    { name: 'profilePicture', maxCount: 1}, // Optional profile picture upload
]), updateUserInfo);
router.get('/public/:email', getUserPublicInfoByEmail);

module.exports = router;