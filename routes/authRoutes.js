import express from 'express';
import {
  registerView,
  loginView,
  registerUser,
  loginUser,
  logoutUser
} from '../controllers/authController.js';

const router = express.Router();

router.get('/register', registerView);
router.post('/register', registerUser);

router.get('/login', loginView);
router.post('/login', loginUser);

router.get('/logout', logoutUser);

export default router;
