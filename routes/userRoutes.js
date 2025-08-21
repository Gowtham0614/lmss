import express from 'express';
import { updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.post('/profile', updateProfile);

export default router;

