import { Request, Response } from 'express';
import { ContactService, NewsletterService } from '../services/contactService';
import { validateContact, validateNewsletter, validateId, validatePagination } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

export class ContactController {
  /**
   * @route POST /api/contacts
   * @desc Create a new contact inquiry
   * @access Public
   */
  static createContact = [
    validateContact,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const contact = await ContactService.createContact(req.body);
      
      res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact inquiry submitted successfully',
      });
    })
  ];

  /**
   * @route GET /api/contacts
   * @desc Get all contact inquiries with filtering and pagination
   * @access Private (Admin/Staff)
   */
  static getAllContacts = [
    requireRole('admin', 'staff'),
    validatePagination,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<PaginatedResponse>) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        assignedTo: req.query.assignedTo as string,
        search: req.query.search as string,
      };

      const result = await ContactService.getAllContacts(page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: result.contacts,
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
   * @route GET /api/contacts/:id
   * @desc Get contact inquiry by ID
   * @access Private (Admin/Staff)
   */
  static getContactById = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const contact = await ContactService.getContactById(id);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact inquiry not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: contact,
        message: 'Contact inquiry retrieved successfully',
      });
    })
  ];

  /**
   * @route PUT /api/contacts/:id
   * @desc Update contact inquiry
   * @access Private (Admin/Staff)
   */
  static updateContact = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedContact = await ContactService.updateContact(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedContact,
        message: 'Contact inquiry updated successfully',
      });
    })
  ];

  /**
   * @route DELETE /api/contacts/:id
   * @desc Delete contact inquiry (soft delete)
   * @access Private (Admin/Staff)
   */
  static deleteContact = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      await ContactService.deleteContact(id);
      
      res.status(200).json({
        success: true,
        message: 'Contact inquiry deleted successfully',
      });
    })
  ];

  /**
   * @route PUT /api/contacts/:id/assign
   * @desc Assign contact inquiry to staff member
   * @access Private (Admin/Staff)
   */
  static assignContact = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({
          success: false,
          message: 'Assigned staff member is required',
        });
      }
      
      const updatedContact = await ContactService.assignContact(id, assignedTo);
      
      res.status(200).json({
        success: true,
        data: updatedContact,
        message: 'Contact inquiry assigned successfully',
      });
    })
  ];

  /**
   * @route PUT /api/contacts/:id/respond
   * @desc Respond to contact inquiry
   * @access Private (Admin/Staff)
   */
  static respondToContact = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const { response, status } = req.body;

      if (!response) {
        return res.status(400).json({
          success: false,
          message: 'Response text is required',
        });
      }
      
      const updates: any = { response, status: status || 'resolved' };
      const updatedContact = await ContactService.updateContact(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedContact,
        message: 'Response added successfully',
      });
    })
  ];

  /**
   * @route POST /api/newsletter/subscribe
   * @desc Subscribe to newsletter
   * @access Public
   */
  static subscribeNewsletter = [
    validateNewsletter,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const subscriber = await NewsletterService.subscribe(req.body);
      
      res.status(201).json({
        success: true,
        data: subscriber,
        message: 'Successfully subscribed to newsletter',
      });
    })
  ];

  /**
   * @route GET /api/newsletter/subscribers
   * @desc Get all newsletter subscribers
   * @access Private (Admin/Staff)
   */
  static getNewsletterSubscribers = [
    requireRole('admin', 'staff'),
    validatePagination,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<PaginatedResponse>) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await NewsletterService.getAllSubscribers(page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: result.subscribers,
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
   * @route POST /api/newsletter/unsubscribe
   * @desc Unsubscribe from newsletter
   * @access Public
   */
  static unsubscribeNewsletter = [
    validateNewsletter,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const { email } = req.body;
      
      await NewsletterService.unsubscribe(email);
      
      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      });
    })
  ];

  /**
   * @route DELETE /api/newsletter/subscribers/:id
   * @desc Delete newsletter subscriber
   * @access Private (Admin/Staff)
   */
  static deleteNewsletterSubscriber = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      await NewsletterService.deleteSubscriber(id);
      
      res.status(200).json({
        success: true,
        message: 'Newsletter subscriber deleted successfully',
      });
    })
  ];

  /**
   * @route GET /api/newsletter/stats
   * @desc Get newsletter subscription statistics
   * @access Private (Admin/Staff)
   */
  static getNewsletterStats = [
    requireRole('admin', 'staff'),
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const stats = await NewsletterService.getSubscriptionStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Newsletter statistics retrieved successfully',
      });
    })
  ];
}