import db from '../config/database';
import { User, CreateUserRequest } from '../types';
import { hashPassword } from '../utils/helpers';
import { CustomError } from '../middleware/errorHandler';

export class UserModel {
  static async create(userData: CreateUserRequest): Promise<User> {
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      const [user] = await db('users')
        .insert({
          email: userData.email,
          password: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role || 'customer',
        })
        .returning(['*']);

      return this.mapDatabaseUserToUser(user);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new CustomError('Email already exists', 409);
      }
      throw new CustomError('Failed to create user', 500);
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where('id', id)
        .where('is_active', true)
        .first();

      if (!user) {
        return null;
      }

      return this.mapDatabaseUserToUser(user);
    } catch (error) {
      throw new CustomError('Failed to fetch user', 500);
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where('email', email)
        .where('is_active', true)
        .first();

      if (!user) {
        return null;
      }

      return this.mapDatabaseUserToUser(user);
    } catch (error) {
      throw new CustomError('Failed to fetch user', 500);
    }
  }

  static async findByEmailWithPassword(email: string): Promise<User & { password: string } | null> {
    try {
      const user = await db('users')
        .where('email', email)
        .where('is_active', true)
        .first();

      if (!user) {
        return null;
      }

      return this.mapDatabaseUserToUser(user) as User & { password: string };
    } catch (error) {
      throw new CustomError('Failed to fetch user', 500);
    }
  }

  static async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData: any = {};
      
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email) updateData.email = updates.email;
      if (updates.role) updateData.role = updates.role;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.emailVerified !== undefined) {
        updateData.email_verified = updates.emailVerified;
        if (updates.emailVerified) {
          updateData.email_verified_at = new Date();
        }
      }

      updateData.updated_at = new Date();

      const [user] = await db('users')
        .where('id', id)
        .update(updateData)
        .returning(['*']);

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      return this.mapDatabaseUserToUser(user);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new CustomError('Email already exists', 409);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update user', 500);
    }
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      await db('users')
        .where('id', id)
        .update({
          password: hashedPassword,
          updated_at: new Date(),
        });
    } catch (error) {
      throw new CustomError('Failed to update password', 500);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await db('users')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date(),
        });
    } catch (error) {
      throw new CustomError('Failed to delete user', 500);
    }
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      role?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    try {
      let query = db('users').select('*');
      let countQuery = db('users').count('* as count');

      // Apply filters
      if (filters.role) {
        query = query.where('role', filters.role);
        countQuery = countQuery.where('role', filters.role);
      }

      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
        countQuery = countQuery.where('is_active', filters.isActive);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('first_name', 'like', searchTerm)
            .orWhere('last_name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm);
        });
        countQuery = countQuery.where(function() {
          this.where('first_name', 'like', searchTerm)
            .orWhere('last_name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm);
        });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.orderBy('created_at', 'desc').limit(limit).offset(offset);

      // Execute queries
      const [users, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map(this.mapDatabaseUserToUser),
        total,
        totalPages,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch users', 500);
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    try {
      await db('users')
        .where('id', id)
        .update({
          last_login: new Date(),
        });
    } catch (error) {
      // Silently fail for last login updates
      console.error('Failed to update last login:', error);
    }
  }

  static async verifyEmail(id: string): Promise<void> {
    try {
      await db('users')
        .where('id', id)
        .update({
          email_verified: true,
          email_verified_at: new Date(),
          email_verification_token: null,
          updated_at: new Date(),
        });
    } catch (error) {
      throw new CustomError('Failed to verify email', 500);
    }
  }

  static async setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await db('users')
        .where('id', id)
        .update({
          password_reset_token: token,
          password_reset_expires: expiresAt,
          updated_at: new Date(),
        });
    } catch (error) {
      throw new CustomError('Failed to set password reset token', 500);
    }
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      const user = await db('users')
        .where('password_reset_token', token)
        .where('password_reset_expires', '>', new Date())
        .where('is_active', true)
        .first();

      if (!user) {
        return null;
      }

      return this.mapDatabaseUserToUser(user);
    } catch (error) {
      throw new CustomError('Failed to fetch user', 500);
    }
  }

  private static mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      role: dbUser.role,
      isActive: dbUser.is_active,
      emailVerified: dbUser.email_verified,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };
  }
}