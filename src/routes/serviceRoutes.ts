import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController';
import { apiLimiter } from '../middleware/rateLimiter';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// Public routes
router.get('/services', ServiceController.getAllServices);
router.get('/services/available', ServiceController.getAvailableServices);
router.get('/services/category/:category', ServiceController.getServicesByCategory);
router.get('/services/:id', ServiceController.getServiceById);

// Protected routes (Admin/Staff)
router.post('/services', authenticate, requireRole('admin', 'staff'), ServiceController.createService);
router.put('/services/:id', authenticate, requireRole('admin', 'staff'), ServiceController.updateService);
router.delete('/services/:id', authenticate, requireRole('admin', 'staff'), ServiceController.deleteService);

export default router;