import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  getRegisteredUsers,
  adminLogin,
  updateUser,
  deleteUser,
} from '../controllers/authController';
import { requireAdminAuth } from '../middleware/authMiddleware';

const router = Router();

// Rate limiter for Admin Login to prevent brute-force attacks (5 requests per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many failed admin login attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for User Registration to prevent spam (20 requests per 15 minutes)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many registration requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Direct User Registration in MySQL
router.post('/register', registerLimiter, registerUser);

// Get list of registered users in MySQL
router.get('/users', getRegisteredUsers);

// Admin Login (Protected with Brute-Force Rate Limiter)
router.post('/admin/login', adminLoginLimiter, adminLogin);

// Admin CRUD Operations for Users (Protected with Admin Auth Middleware)
router.put('/users/:id', requireAdminAuth, updateUser);
router.delete('/users/:id', requireAdminAuth, deleteUser);

export default router;
