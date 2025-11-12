import db from '../config/database';
import { Service, CreateServiceRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class ServiceModel {
  static async create(serviceData: CreateServiceRequest): Promise<Service> {
    try {
      const [service] = await db('services')
        .insert({
          name: serviceData.name,
          description: serviceData.description,
          category: serviceData.category,
          base_price: serviceData.basePrice,
          estimated_duration: serviceData.estimatedDuration,
          is_active: serviceData.isActive !== false,
          is_available_for_booking: serviceData.isAvailableForBooking !== false,
          requirements: serviceData.requirements ? JSON.stringify(serviceData.requirements) : null,
        })
        .returning(['*']);

      return this.mapDatabaseServiceToService(service);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new CustomError('Service with this name already exists', 409);
      }
      throw new CustomError('Failed to create service', 500);
    }
  }

  static async findById(id: string): Promise<Service | null> {
    try {
      const service = await db('services')
        .where('id', id)
        .first();

      if (!service) {
        return null;
      }

      return this.mapDatabaseServiceToService(service);
    } catch (error) {
      throw new CustomError('Failed to fetch service', 500);
    }
  }

  static async findByName(name: string): Promise<Service | null> {
    try {
      const service = await db('services')
        .where('name', name)
        .where('is_active', true)
        .first();

      if (!service) {
        return null;
      }

      return this.mapDatabaseServiceToService(service);
    } catch (error) {
      throw new CustomError('Failed to fetch service', 500);
    }
  }

  static async update(id: string, updates: Partial<Service>): Promise<Service> {
    try {
      const updateData: any = {
        updated_at: new Date(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
      if (updates.estimatedDuration !== undefined) updateData.estimated_duration = updates.estimatedDuration;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isAvailableForBooking !== undefined) updateData.is_available_for_booking = updates.isAvailableForBooking;
      if (updates.requirements) updateData.requirements = JSON.stringify(updates.requirements);

      const [service] = await db('services')
        .where('id', id)
        .update(updateData)
        .returning(['*']);

      if (!service) {
        throw new CustomError('Service not found', 404);
      }

      return this.mapDatabaseServiceToService(service);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      if (error.code === '23505') {
        throw new CustomError('Service with this name already exists', 409);
      }
      throw new CustomError('Failed to update service', 500);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const [service] = await db('services')
        .where('id', id)
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .returning(['*']);

      if (!service) {
        throw new CustomError('Service not found', 404);
      }
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete service', 500);
    }
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      category?: string;
      isActive?: boolean;
      isAvailableForBooking?: boolean;
      search?: string;
    } = {}
  ): Promise<{ services: Service[]; total: number; totalPages: number }> {
    try {
      let query = db('services').select('*');
      let countQuery = db('services').count('* as count');

      // Apply filters
      if (filters.category) {
        query = query.where('category', filters.category);
        countQuery = countQuery.where('category', filters.category);
      }

      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
        countQuery = countQuery.where('is_active', filters.isActive);
      }

      if (filters.isAvailableForBooking !== undefined) {
        query = query.where('is_available_for_booking', filters.isAvailableForBooking);
        countQuery = countQuery.where('is_available_for_booking', filters.isAvailableForBooking);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('name', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm);
        });
        countQuery = countQuery.where(function() {
          this.where('name', 'like', searchTerm)
            .orWhere('description', 'like', searchTerm);
        });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.orderBy('name', 'asc').limit(limit).offset(offset);

      // Execute queries
      const [services, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        services: services.map(this.mapDatabaseServiceToService),
        total,
        totalPages,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch services', 500);
    }
  }

  static async findAvailableForBooking(): Promise<Service[]> {
    try {
      const services = await db('services')
        .where('is_active', true)
        .where('is_available_for_booking', true)
        .orderBy('name', 'asc');

      return services.map(this.mapDatabaseServiceToService);
    } catch (error) {
      throw new CustomError('Failed to fetch available services', 500);
    }
  }

  static async findByCategory(category: string): Promise<Service[]> {
    try {
      const services = await db('services')
        .where('category', category)
        .where('is_active', true)
        .orderBy('name', 'asc');

      return services.map(this.mapDatabaseServiceToService);
    } catch (error) {
      throw new CustomError('Failed to fetch services by category', 500);
    }
  }

  private static mapDatabaseServiceToService(dbService: any): Service {
    return {
      id: dbService.id,
      name: dbService.name,
      description: dbService.description,
      category: dbService.category,
      basePrice: parseFloat(dbService.base_price),
      estimatedDuration: dbService.estimated_duration,
      isActive: dbService.is_active,
      isAvailableForBooking: dbService.is_available_for_booking,
      requirements: dbService.requirements ? JSON.parse(dbService.requirements) : undefined,
      createdAt: new Date(dbService.created_at),
      updatedAt: new Date(dbService.updated_at),
    };
  }
}