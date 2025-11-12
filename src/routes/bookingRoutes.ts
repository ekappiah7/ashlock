import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { bookingLimiter, apiLimiter } from '../middleware/rateLimiter';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Apply rate limiting
router.use(apiLimiter);

// Public routes
router.post('/bookings', bookingLimiter, BookingController.createBooking);
router.get('/bookings/availability/:service', BookingController.checkAvailability);

// Protected routes
router.get('/bookings', authenticate, BookingController.getAllBookings);
router.get('/bookings/my-bookings', authenticate, BookingController.getMyBookings);
router.get('/bookings/customer/:email', authenticate, BookingController.getCustomerBookings);
router.get('/bookings/:id', authenticate, BookingController.getBookingById);
router.put('/bookings/:id', authenticate, BookingController.updateBooking);
router.delete('/bookings/:id', authenticate, BookingController.cancelBooking);
router.get('/bookings/calendar/:startDate/:endDate', authenticate, BookingController.getCalendarBookings);
router.get('/bookings/stats', authenticate, BookingController.getBookingStats);

// Admin/Staff specific routes
router.put('/bookings/:id/confirm', authenticate, BookingController.confirmBooking);
router.put('/bookings/:id/start', authenticate, BookingController.startBooking);
router.put('/bookings/:id/complete', authenticate, BookingController.completeBooking);
router.put('/bookings/:id/assign', authenticate, BookingController.assignTechnician);

export default router;