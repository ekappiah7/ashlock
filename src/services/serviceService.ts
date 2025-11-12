import { ServiceModel } from '../models/Service';
import { CreateServiceRequest, Service } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class ServiceService {
  static async createService(serviceData: CreateServiceRequest): Promise<Service> {
    try {
      return await ServiceModel.create(serviceData);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create service', 500);
    }
  }

  static async getAllServices(
    page: number = 1,
    limit: number = 10,
    filters: {
      category?: string;
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ services: Service[]; total: number; totalPages: number }> {
    try {
      return await ServiceModel.findAll(page, limit, filters);
    } catch (error) {
      throw new CustomError('Failed to fetch services', 500);
    }
  }

  static async getServiceById(id: string): Promise<Service | null> {
    try {
      return await ServiceModel.findById(id);
    } catch (error) {
      throw new CustomError('Failed to fetch service', 500);
    }
  }

  static async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    try {
      return await ServiceModel.update(id, updates);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update service', 500);
    }
  }

  static async deleteService(id: string): Promise<void> {
    try {
      await ServiceModel.delete(id);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete service', 500);
    }
  }

  static async getAvailableServices(): Promise<Service[]> {
    try {
      return await ServiceModel.findAvailableForBooking();
    } catch (error) {
      throw new CustomError('Failed to fetch available services', 500);
    }
  }

  static async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      return await ServiceModel.findByCategory(category);
    } catch (error) {
      throw new CustomError('Failed to fetch services by category', 500);
    }
  }
}