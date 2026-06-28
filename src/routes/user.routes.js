import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getBirthdays,
    getAnniversaries,
    getUserSettings,
    updateUserSettings,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/login').post(loginUser);
router.route('/verify-email').post(verifyEmail);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/refresh-token').post(refreshAccessToken);

router.route('/logout').post(verifyJWT, logOutUser);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/birthdays').get(verifyJWT, getBirthdays);
router.route('/anniversaries').get(verifyJWT, getAnniversaries);
router.route('/settings').get(verifyJWT, getUserSettings).post(verifyJWT, updateUserSettings).patch(verifyJWT, updateUserSettings);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/update-account').patch(verifyJWT, updateAccountDetails);
router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar);
router.route('/').get(verifyJWT, getUsers);
router.route('/:id').get(verifyJWT, getUserById).patch(verifyJWT, updateUserById).delete(verifyJWT, deleteUserById);

export default router;
