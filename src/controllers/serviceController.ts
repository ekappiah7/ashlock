import { Request, Response } from 'express';
import { ServiceService } from '../services/serviceService';
import { validateService, validateId, validatePagination } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

export class ServiceController {
  /**
   * @route GET /api/services
   * @desc Get all services
   * @access Public
   */
  static getAllServices = [
    validatePagination,
    asyncHandler(async (req: Request, res: Response<PaginatedResponse>) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        category: req.query.category as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await ServiceService.getAllServices(page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: result.services,
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
   * @route GET /api/services/available
   * @desc Get available services for booking
   * @access Public
   */
  static getAvailableServices = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const services = await ServiceService.getAvailableServices();
    
    res.status(200).json({
      success: true,
      data: services,
      message: `Found ${services.length} available service(s)`,
    });
  });

  /**
   * @route GET /api/services/category/:category
   * @desc Get services by category
   * @access Public
   */
  static getServicesByCategory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { category } = req.params;
    
    const services = await ServiceService.getServicesByCategory(category);
    
    res.status(200).json({
      success: true,
      data: services,
      message: `Found ${services.length} service(s) in ${category} category`,
    });
  });

  /**
   * @route GET /api/services/:id
   * @desc Get service by ID
   * @access Public
   */
  static getServiceById = [
    validateId,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const service = await ServiceService.getServiceById(id);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: service,
        message: 'Service retrieved successfully',
      });
    })
  ];

  /**
   * @route POST /api/services
   * @desc Create a new service
   * @access Private (Admin/Staff)
   */
  static createService = [
    requireRole('admin', 'staff'),
    validateService,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const service = await ServiceService.createService(req.body);
      
      res.status(201).json({
        success: true,
        data: service,
        message: 'Service created successfully',
      });
    })
  ];

  /**
   * @route PUT /api/services/:id
   * @desc Update service
   * @access Private (Admin/Staff)
   */
  static updateService = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedService = await ServiceService.updateService(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedService,
        message: 'Service updated successfully',
      });
    })
  ];

  /**
   * @route DELETE /api/services/:id
   * @desc Delete service
   * @access Private (Admin/Staff)
   */
  static deleteService = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      await ServiceService.deleteService(id);
      
      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
      });
    })
  ];
}