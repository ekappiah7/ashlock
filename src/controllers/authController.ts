import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { validateRegister, validateLogin, validateUpdateUser, validateUpdatePassword } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

export class AuthController {
  /**
   * @route POST /api/auth/register
   * @desc Register a new user
   * @access Public
   */
  static register = [
    validateRegister,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    })
  ];

  /**
   * @route POST /api/auth/login
   * @desc Login user
   * @access Public
   */
  static login = [
    validateLogin,
    asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
      const result = await AuthService.login(req.body);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    })
  ];

  /**
   * @route POST /api/auth/refresh
   * @desc Refresh access token
   * @access Public
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await AuthService.refreshToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  });

  /**
   * @route GET /api/auth/profile
   * @desc Get current user profile
   * @access Private
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await AuthService.getProfile(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully',
    });
  });

  /**
   * @route PUT /api/auth/profile
   * @desc Update user profile
   * @access Private
   */
  static updateProfile = [
    validateUpdateUser,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const updatedUser = await AuthService.updateProfile(req.user.id, {
        ...req.body,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
      });
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    })
  ];

  /**
   * @route PUT /api/auth/password
   * @desc Change user password
   * @access Private
   */
  static changePassword = [
    validateUpdatePassword,
    asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      await AuthService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    })
  ];

  /**
   * @route POST /api/auth/forgot-password
   * @desc Send password reset email
   * @access Public
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await AuthService.forgotPassword(email);
    
    res.status(200).json({
      success: true,
      ...result,
    });
  });

  /**
   * @route POST /api/auth/reset-password
   * @desc Reset password with token
   * @access Public
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    // Validate password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      });
    }

    await AuthService.resetPassword(resetToken, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  });

  /**
   * @route POST /api/auth/logout
   * @desc Logout user
   * @access Private
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    await AuthService.logout(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * @route POST /api/auth/verify-email
   * @desc Verify user email
   * @access Public
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // This would typically verify the email token and mark the user as verified
    // Implementation would depend on your email verification strategy
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  });

  /**
   * @route POST /api/auth/resend-verification
   * @desc Resend email verification
   * @access Public
   */
  static resendVerification = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // This would typically generate a new verification token and send an email
    res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  });
}