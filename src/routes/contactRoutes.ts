import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { contactLimiter, apiLimiter } from '../middleware/rateLimiter';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// Public routes
router.post('/contacts', contactLimiter, ContactController.createContact);
router.post('/newsletter/subscribe', contactLimiter, ContactController.subscribeNewsletter);
router.post('/newsletter/unsubscribe', contactLimiter, ContactController.unsubscribeNewsletter);

// Protected routes (Admin/Staff)
router.get('/contacts', authenticate, requireRole('admin', 'staff'), ContactController.getAllContacts);
router.get('/contacts/:id', authenticate, requireRole('admin', 'staff'), ContactController.getContactById);
router.put('/contacts/:id', authenticate, requireRole('admin', 'staff'), ContactController.updateContact);
router.delete('/contacts/:id', authenticate, requireRole('admin', 'staff'), ContactController.deleteContact);
router.put('/contacts/:id/assign', authenticate, requireRole('admin', 'staff'), ContactController.assignContact);
router.put('/contacts/:id/respond', authenticate, requireRole('admin', 'staff'), ContactController.respondToContact);

// Newsletter management (Admin/Staff)
router.get('/newsletter/subscribers', authenticate, requireRole('admin', 'staff'), ContactController.getNewsletterSubscribers);
router.delete('/newsletter/subscribers/:id', authenticate, requireRole('admin', 'staff'), ContactController.deleteNewsletterSubscriber);
router.get('/newsletter/stats', authenticate, requireRole('admin', 'staff'), ContactController.getNewsletterStats);

export default router;