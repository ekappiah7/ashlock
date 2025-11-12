import { BookingModel } from '../models/Booking';
import { CreateBookingRequest, UpdateBookingRequest, Booking } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class BookingService {
  static async createBooking(bookingData: CreateBookingRequest, userId?: string): Promise<Booking> {
    try {
      // Check if the requested time slot is available
      const availableSlots = await BookingModel.getAvailableSlots(
        bookingData.service,
        bookingData.bookingDate
      );
      
      const requestedTimeSlot = availableSlots.find(slot => slot.time === bookingData.bookingTime);
      if (!requestedTimeSlot || !requestedTimeSlot.available) {
        throw new CustomError('Selected time slot is not available', 400);
      }

      // Create the booking
      const booking = await BookingModel.create(bookingData, userId);
      
      return booking;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create booking', 500);
    }
  }

  static async getAllBookings(
    page: number = 1,
    limit: number = 10,
    filters: {
      userId?: string;
      status?: string;
      serviceType?: string;
      customerEmail?: string;
      dateFrom?: string;
      dateTo?: string;
      assignedTechnician?: string;
    } = {}
  ): Promise<{ bookings: Booking[]; total: number; totalPages: number }> {
    try {
      const result = await BookingModel.findAll(page, limit, filters);
      return result;
    } catch (error) {
      throw new CustomError('Failed to fetch bookings', 500);
    }
  }

  static async getUserBookings(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ bookings: Booking[]; total: number; totalPages: number }> {
    try {
      return await BookingModel.findAll(page, limit, { userId });
    } catch (error) {
      throw new CustomError('Failed to fetch user bookings', 500);
    }
  }

  static async getBookingById(id: string): Promise<Booking | null> {
    try {
      return await BookingModel.findById(id);
    } catch (error) {
      throw new CustomError('Failed to fetch booking', 500);
    }
  }

  static async updateBooking(id: string, updates: UpdateBookingRequest): Promise<Booking> {
    try {
      return await BookingModel.update(id, updates);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update booking', 500);
    }
  }

  static async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    try {
      return await BookingModel.update(id, { status });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update booking status', 500);
    }
  }

  static async cancelBooking(id: string): Promise<void> {
    try {
      await BookingModel.delete(id);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to cancel booking', 500);
    }
  }

  static async getCustomerBookings(customerEmail: string): Promise<Booking[]> {
    try {
      return await BookingModel.getCustomerBookings(customerEmail);
    } catch (error) {
      throw new CustomError('Failed to fetch customer bookings', 500);
    }
  }

  static async getAvailableSlots(service: string, date: string): Promise<{ time: string; available: boolean }[]> {
    try {
      return await BookingModel.getAvailableSlots(service, date);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to check availability', 500);
    }
  }

  static async getBookingsByDateRange(
    startDate: string,
    endDate: string,
    technician?: string
  ): Promise<Booking[]> {
    try {
      return await BookingModel.getBookingsByDateRange(startDate, endDate, technician);
    } catch (error) {
      throw new CustomError('Failed to fetch bookings by date range', 500);
    }
  }

  static async getBookingStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }> {
    try {
      return await BookingModel.getBookingStats(dateFrom, dateTo);
    } catch (error) {
      throw new CustomError('Failed to fetch booking statistics', 500);
    }
  }
}