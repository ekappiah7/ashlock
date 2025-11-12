import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { validateId, validatePagination, validateUpdateUser } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

export class UserController {
  /**
   * @route GET /api/users
   * @desc Get all users with filtering and pagination
   * @access Private (Admin/Staff)
   */
  static getAllUsers = [
    requireRole('admin', 'staff'),
    validatePagination,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<PaginatedResponse>) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const filters = {
        role: req.query.role as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
      };

      const result = await UserService.getAllUsers(page, limit, filters);
      
      res.status(200).json({
        success: true,
        data: result.users,
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
   * @route GET /api/users/:id
   * @desc Get user by ID
   * @access Private (Admin/Staff)
   */
  static getUserById = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const user = await UserService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    })
  ];

  /**
   * @route PUT /api/users/:id
   * @desc Update user
   * @access Private (Admin/Staff)
   */
  static updateUser = [
    requireRole('admin', 'staff'),
    validateId,
    validateUpdateUser,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedUser = await UserService.updateUser(id, updates);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    })
  ];

  /**
   * @route DELETE /api/users/:id
   * @desc Delete user (soft delete)
   * @access Private (Admin/Staff)
   */
  static deleteUser = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }
      
      await UserService.deleteUser(id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    })
  ];

  /**
   * @route PUT /api/users/:id/activate
   * @desc Activate user account
   * @access Private (Admin/Staff)
   */
  static activateUser = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      const updatedUser = await UserService.updateUser(id, { isActive: true });
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User account activated successfully',
      });
    })
  ];

  /**
   * @route PUT /api/users/:id/deactivate
   * @desc Deactivate user account
   * @access Private (Admin/Staff)
   */
  static deactivateUser = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      
      // Prevent admin from deactivating themselves
      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }
      
      const updatedUser = await UserService.updateUser(id, { isActive: false });
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User account deactivated successfully',
      });
    })
  ];

  /**
   * @route PUT /api/users/:id/change-role
   * @desc Change user role
   * @access Private (Admin/Staff)
   */
  static changeUserRole = [
    requireRole('admin', 'staff'),
    validateId,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required',
        });
      }

      if (!['customer', 'admin', 'staff'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }
      
      const updatedUser = await UserService.updateUser(id, { role });
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User role updated successfully',
      });
    })
  ];
}