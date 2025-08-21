import express from 'express';
import {
  adminDashboard,
  adminGetUsers,
  adminGetUserDetails,
  adminUpdateUserStatus,
  adminDeleteUser,
  adminForceReturn,
  getSystemStats
} from '../controllers/adminController.js';
import { adminGetActivities } from '../controllers/activityController.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin privileges
router.use(isAdmin);

// Dashboard
router.get('/admin', adminDashboard);
router.get('/admin/dashboard', adminDashboard);

// Users management
router.get('/admin/users', adminGetUsers);
router.get('/admin/users/:id', adminGetUserDetails);
router.put('/admin/users/:id/status', adminUpdateUserStatus);
router.delete('/admin/users/:id', adminDeleteUser);
router.post('/admin/users/:userId/return/:bookId', adminForceReturn);

// Activities management
router.get('/admin/activities', adminGetActivities);

// API endpoints
router.get('/api/admin/stats', getSystemStats);

export default router;
