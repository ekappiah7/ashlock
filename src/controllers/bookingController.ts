import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { validateBooking, validateId, validatePagination } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

export class BookingController {
  /**
   * @route POST /api/bookings
   * @desc Create a new booking
   * @access Public
   */
  static createBooking = [
    validateBooking,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const booking = await BookingService.createBooking(req.body, (req as AuthenticatedRequest).user?.id);
      
      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully',
      });
    })
  ];

  /**
   * @route GET /api/bookings
   * @desc Get all bookings with filtering and pagination
   * @access Private (Admin/Staff)
   */
  static getAllBookings = [
    requireRole('admin', 'staff'),
    validatePagination,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<PaginatedResponse>) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        status: req.query.status as string,
        serviceType: req.query.serviceType as string,
        customerEmail: req.query.customerEmail as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        assignedTechnician: req.query.assignedTechnician as string,
      };

      const result = await BookingService.getAllBookings(page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
          hasPrev: page > 1,
        },
      });
    })
  ];

  /**
   * @route GET /api/bookings/my-bookings
   * @desc Get current user's bookings
   * @access Private
   */
  static getMyBookings = [
    validatePagination,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<PaginatedResponse>) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await BookingService.getUserBookings(req.user.id, page, limit);
      
      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: page < result.totalPages,
          hasPrev: page > 1,
        },
      });
    })
  ];

  /**
   * @route GET /api/bookings/customer/:email
   * @desc Get bookings by customer email
   * @access Private (Admin/Staff)
   */
  static getCustomerBookings = [
    requireRole('admin', 'staff'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { email } = req.params;
      
      const bookings = await BookingService.getCustomerBookings(email);
      
      res.status(200).json({
        success: true,
        data: bookings,
        message: `Found ${bookings.length} booking(s) for customer`,
      });
    })
  ];

  /**
   * @route GET /api/bookings/:id
   * @desc Get booking by ID
   * @access Private
   */
  static getBookingById = [
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const booking = await BookingService.getBookingById(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      // Check if user has permission to view this booking
      if (req.user?.role === 'customer' && booking.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      
      res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking retrieved successfully',
      });
    })
  ];

  /**
   * @route PUT /api/bookings/:id
   * @desc Update booking
   * @access Private (Admin/Staff)
   */
  static updateBooking = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedBooking = await BookingService.updateBooking(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully',
      });
    })
  ];

  /**
   * @route DELETE /api/bookings/:id
   * @desc Cancel booking
   * @access Private
   */
  static cancelBooking = [
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      // Check if user has permission to cancel this booking
      if (req.user?.role === 'customer') {
        const booking = await BookingService.getBookingById(id);
        if (!booking || booking.userId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }
      
      await BookingService.cancelBooking(id);
      
      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
      });
    })
  ];

  /**
   * @route GET /api/bookings/availability/:service
   * @desc Check service availability for a date
   * @access Public
   */
  static checkAvailability = [
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const { service } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required',
        });
      }

      const availableSlots = await BookingService.getAvailableSlots(service, date as string);
      
      res.status(200).json({
        success: true,
        data: {
          service,
          date,
          availableSlots,
        },
        message: 'Availability checked successfully',
      });
    })
  ];

  /**
   * @route GET /api/bookings/calendar/:startDate/:endDate
   * @desc Get bookings for calendar view
   * @access Private (Admin/Staff)
   */
  static getCalendarBookings = [
    requireRole('admin', 'staff'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { startDate, endDate } = req.params;
      const { technician } = req.query;
      
      const bookings = await BookingService.getBookingsByDateRange(
        startDate,
        endDate,
        technician as string
      );
      
      res.status(200).json({
        success: true,
        data: bookings,
        message: `Found ${bookings.length} booking(s) in the specified period`,
      });
    })
  ];

  /**
   * @route GET /api/bookings/stats
   * @desc Get booking statistics
   * @access Private (Admin/Staff)
   */
  static getBookingStats = [
    requireRole('admin', 'staff'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { dateFrom, dateTo } = req.query;
      
      const stats = await BookingService.getBookingStats(
        dateFrom as string,
        dateTo as string
      );
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Booking statistics retrieved successfully',
      });
    })
  ];

  /**
   * @route PUT /api/bookings/:id/confirm
   * @desc Confirm booking
   * @access Private (Admin/Staff)
   */
  static confirmBooking = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const updatedBooking = await BookingService.updateBookingStatus(id, 'confirmed');
      
      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Booking confirmed successfully',
      });
    })
  ];

  /**
   * @route PUT /api/bookings/:id/start
   * @desc Start booking (mark as in progress)
   * @access Private (Admin/Staff)
   */
  static startBooking = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const updatedBooking = await BookingService.updateBookingStatus(id, 'in_progress');
      
      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Booking started successfully',
      });
    })
  ];

  /**
   * @route PUT /api/bookings/:id/complete
   * @desc Complete booking
   * @access Private (Admin/Staff)
   */
  static completeBooking = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const { actualCost, notes } = req.body;
      
      const updates: any = { status: 'completed' };
      if (actualCost !== undefined) updates.actualCost = actualCost;
      if (notes !== undefined) updates.notes = notes;
      
      const updatedBooking = await BookingService.updateBooking(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Booking completed successfully',
      });
    })
  ];

  /**
   * @route PUT /api/bookings/:id/assign
   * @desc Assign technician to booking
   * @access Private (Admin/Staff)
   */
  static assignTechnician = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const { technician } = req.body;

      if (!technician) {
        return res.status(400).json({
          success: false,
          message: 'Technician name is required',
        });
      }
      
      const updatedBooking = await BookingService.updateBooking(id, {
        assignedTechnician: technician,
      });
      
      res.status(200).json({
        success: true,
        data: updatedBooking,
        message: 'Technician assigned successfully',
      });
    })
  ];
}