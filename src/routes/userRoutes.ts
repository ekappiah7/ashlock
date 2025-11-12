import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { apiLimiter } from '../middleware/rateLimiter';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// Protected routes (Admin/Staff only)
router.get('/users', authenticate, requireRole('admin', 'staff'), UserController.getAllUsers);
router.get('/users/:id', authenticate, requireRole('admin', 'staff'), UserController.getUserById);
router.put('/users/:id', authenticate, requireRole('admin', 'staff'), UserController.updateUser);
router.delete('/users/:id', authenticate, requireRole('admin', 'staff'), UserController.deleteUser);
router.put('/users/:id/activate', authenticate, requireRole('admin', 'staff'), UserController.activateUser);
router.put('/users/:id/deactivate', authenticate, requireRole('admin', 'staff'), UserController.deactivateUser);
router.put('/users/:id/change-role', authenticate, requireRole('admin', 'staff'), UserController.changeUserRole);

export default router;