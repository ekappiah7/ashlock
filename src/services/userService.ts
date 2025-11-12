import { UserModel } from '../models/User';
import { User } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class UserService {
  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters: {
      role?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    try {
      return await UserModel.findAll(page, limit, filters);
    } catch (error) {
      throw new CustomError('Failed to fetch users', 500);
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      return await UserModel.findById(id);
    } catch (error) {
      throw new CustomError('Failed to fetch user', 500);
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      return await UserModel.update(id, updates);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update user', 500);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await UserModel.delete(id);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete user', 500);
    }
  }

  static async activateUser(id: string): Promise<User> {
    try {
      return await UserModel.update(id, { isActive: true });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to activate user', 500);
    }
  }

  static async deactivateUser(id: string): Promise<User> {
    try {
      return await UserModel.update(id, { isActive: false });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to deactivate user', 500);
    }
  }

  static async changeUserRole(id: string, role: User['role']): Promise<User> {
    try {
      return await UserModel.update(id, { role });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to change user role', 500);
    }
  }
}