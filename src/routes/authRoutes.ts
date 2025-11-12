import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { apiLimiter, authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply general rate limiting to all auth routes
router.use('/auth', apiLimiter);

// Auth routes
router.post('/auth/register', authLimiter, AuthController.register);
router.post('/auth/login', authLimiter, AuthController.login);
router.post('/auth/refresh', authLimiter, AuthController.refreshToken);
router.post('/auth/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/auth/reset-password', authLimiter, AuthController.resetPassword);
router.post('/auth/logout', authenticate, AuthController.logout);
router.post('/auth/verify-email', authLimiter, AuthController.verifyEmail);
router.post('/auth/resend-verification', authLimiter, AuthController.resendVerification);

// Protected routes
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/profile', authenticate, AuthController.updateProfile);
router.put('/auth/password', authenticate, AuthController.changePassword);

export default router;