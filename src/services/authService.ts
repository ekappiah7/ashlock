import { UserModel } from '../models/User';
import { comparePassword, generateAccessToken, generateRefreshToken, generateVerificationToken, generatePasswordResetToken } from '../utils/helpers';
import { User, CreateUserRequest, LoginRequest, AuthResponse } from '../types';
import { CustomError } from '../middleware/errorHandler';
import config from '../config/config';

export class AuthService {
  static async register(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new CustomError('User with this email already exists', 409);
      }

      // Create new user
      const user = await UserModel.create(userData);

      // Generate tokens
      const token = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        refreshToken,
        expiresIn: config.JWT_EXPIRES_IN,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Registration failed', 500);
    }
  }

  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user with password
      const userWithPassword = await UserModel.findByEmailWithPassword(loginData.email);
      if (!userWithPassword) {
        throw new CustomError('Invalid email or password', 401);
      }

      if (!userWithPassword.isActive) {
        throw new CustomError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await comparePassword(loginData.password, userWithPassword.password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Update last login
      await UserModel.updateLastLogin(userWithPassword.id);

      // Generate tokens
      const token = generateAccessToken(userWithPassword);
      const refreshToken = generateRefreshToken(userWithPassword);

      // Remove password from response
      const { password, ...userWithoutPassword } = userWithPassword;

      return {
        user: userWithoutPassword,
        token,
        refreshToken,
        expiresIn: config.JWT_EXPIRES_IN,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Login failed', 500);
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = require('jsonwebtoken').verify(refreshToken, config.JWT_REFRESH_SECRET);
      
      // Find user
      const user = await UserModel.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new CustomError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const newToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        user,
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: config.JWT_EXPIRES_IN,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Invalid refresh token', 401);
    }
  }

  static async getProfile(userId: string): Promise<User> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      if (!user.isActive) {
        throw new CustomError('Account is deactivated', 401);
      }

      return user;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to fetch profile', 500);
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const user = await UserModel.update(userId, updates);
      return user;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update profile', 500);
    }
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user with current password
      const userWithPassword = await UserModel.findByEmailWithPassword(
        (await UserModel.findById(userId))?.email || ''
      );
      
      if (!userWithPassword) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, userWithPassword.password);
      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400);
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update password', 500);
    }
  }

  static async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          message: 'If an account with that email exists, a password reset email has been sent.',
        };
      }

      // Generate reset token
      const resetToken = generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await UserModel.setPasswordResetToken(user.id, resetToken, resetExpires);

      // In a real application, you would send an email here
      console.log('Password reset token for', email, ':', resetToken);

      return {
        message: 'If an account with that email exists, a password reset email has been sent.',
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process password reset request', 500);
    }
  }

  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(resetToken, config.JWT_SECRET);
      
      if (decoded.type !== 'password_reset') {
        throw new CustomError('Invalid reset token', 400);
      }

      // Find user by reset token
      const user = await UserModel.findByPasswordResetToken(resetToken);
      if (!user) {
        throw new CustomError('Invalid or expired reset token', 400);
      }

      // Update password and clear reset token
      await UserModel.updatePassword(user.id, newPassword);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new CustomError('Invalid or expired reset token', 400);
      }
      throw new CustomError('Failed to reset password', 500);
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await UserModel.findByEmailWithPassword(
        (await UserModel.findById(userId))?.email || ''
      );
      
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400);
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to change password', 500);
    }
  }

  static async logout(userId: string): Promise<void> {
    try {
      // In a real application with refresh tokens stored in database,
      // you would invalidate the refresh token here
      // For now, we'll just update the last login timestamp
      await UserModel.updateLastLogin(userId);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Logout failed', 500);
    }
  }
}