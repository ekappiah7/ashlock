import db from '../config/database';
import { Booking, CreateBookingRequest, UpdateBookingRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class BookingModel {
  static async create(bookingData: CreateBookingRequest, userId?: string): Promise<Booking> {
    try {
      // First get the service to determine duration
      const service = await db('services')
        .where('name', bookingData.service)
        .first();

      if (!service) {
        throw new CustomError('Service not found', 404);
      }

      const [booking] = await db('bookings')
        .insert({
          user_id: userId || null,
          service_id: service.id,
          service: bookingData.service,
          service_type: bookingData.serviceType,
          booking_date: bookingData.bookingDate,
          booking_time: bookingData.bookingTime,
          duration: service.estimated_duration,
          customer_name: bookingData.customerName,
          customer_phone: bookingData.customerPhone,
          customer_email: bookingData.customerEmail,
          service_address: bookingData.serviceAddress,
          service_description: bookingData.serviceDescription,
          special_instructions: bookingData.specialInstructions,
          priority: bookingData.priority || 'medium',
          estimated_cost: service.base_price,
        })
        .returning(['*']);

      return this.mapDatabaseBookingToBooking(booking);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create booking', 500);
    }
  }

  static async findById(id: string): Promise<Booking | null> {
    try {
      const booking = await db('bookings')
        .where('id', id)
        .first();

      if (!booking) {
        return null;
      }

      return this.mapDatabaseBookingToBooking(booking);
    } catch (error) {
      throw new CustomError('Failed to fetch booking', 500);
    }
  }

  static async update(id: string, updates: UpdateBookingRequest): Promise<Booking> {
    try {
      const updateData: any = {
        updated_at: new Date(),
      };

      // Map update fields
      if (updates.status) {
        updateData.status = updates.status;
        if (updates.status === 'confirmed') {
          updateData.confirmed_at = new Date();
        } else if (updates.status === 'in_progress') {
          updateData.started_at = new Date();
        } else if (updates.status === 'completed') {
          updateData.completed_at = new Date();
        }
      }
      if (updates.bookingDate) updateData.booking_date = updates.bookingDate;
      if (updates.bookingTime) updateData.booking_time = updates.bookingTime;
      if (updates.serviceDescription) updateData.service_description = updates.serviceDescription;
      if (updates.specialInstructions) updateData.special_instructions = updates.specialInstructions;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.estimatedCost !== undefined) updateData.estimated_cost = updates.estimatedCost;
      if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
      if (updates.assignedTechnician) updateData.assigned_technician = updates.assignedTechnician;
      if (updates.notes) updateData.notes = updates.notes;

      const [booking] = await db('bookings')
        .where('id', id)
        .update(updateData)
        .returning(['*']);

      if (!booking) {
        throw new CustomError('Booking not found', 404);
      }

      return this.mapDatabaseBookingToBooking(booking);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update booking', 500);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const [booking] = await db('bookings')
        .where('id', id)
        .update({
          status: 'cancelled',
          updated_at: new Date(),
        })
        .returning(['*']);

      if (!booking) {
        throw new CustomError('Booking not found', 404);
      }
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to cancel booking', 500);
    }
  }

  static async findAll(
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
      let query = db('bookings').select('*');
      let countQuery = db('bookings').count('* as count');

      // Apply filters
      if (filters.userId) {
        query = query.where('user_id', filters.userId);
        countQuery = countQuery.where('user_id', filters.userId);
      }

      if (filters.status) {
        query = query.where('status', filters.status);
        countQuery = countQuery.where('status', filters.status);
      }

      if (filters.serviceType) {
        query = query.where('service_type', filters.serviceType);
        countQuery = countQuery.where('service_type', filters.serviceType);
      }

      if (filters.customerEmail) {
        query = query.where('customer_email', 'ilike', `%${filters.customerEmail}%`);
        countQuery = countQuery.where('customer_email', 'ilike', `%${filters.customerEmail}%`);
      }

      if (filters.assignedTechnician) {
        query = query.where('assigned_technician', filters.assignedTechnician);
        countQuery = countQuery.where('assigned_technician', filters.assignedTechnician);
      }

      if (filters.dateFrom) {
        query = query.where('booking_date', '>=', filters.dateFrom);
        countQuery = countQuery.where('booking_date', '>=', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.where('booking_date', '<=', filters.dateTo);
        countQuery = countQuery.where('booking_date', '<=', filters.dateTo);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.orderBy('booking_date', 'desc').orderBy('booking_time', 'desc').limit(limit).offset(offset);

      // Execute queries
      const [bookings, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        bookings: bookings.map(this.mapDatabaseBookingToBooking),
        total,
        totalPages,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch bookings', 500);
    }
  }

  static async getCustomerBookings(customerEmail: string): Promise<Booking[]> {
    try {
      const bookings = await db('bookings')
        .where('customer_email', customerEmail)
        .orderBy('booking_date', 'desc')
        .orderBy('booking_time', 'desc');

      return bookings.map(this.mapDatabaseBookingToBooking);
    } catch (error) {
      throw new CustomError('Failed to fetch customer bookings', 500);
    }
  }

  static async getAvailableSlots(
    service: string,
    date: string
  ): Promise<{ time: string; available: boolean }[]> {
    try {
      // Get service to determine duration
      const serviceData = await db('services')
        .where('name', service)
        .where('is_active', true)
        .where('is_available_for_booking', true)
        .first();

      if (!serviceData) {
        throw new CustomError('Service not available', 404);
      }

      // Generate time slots (9 AM to 5 PM, 1-hour intervals)
      const timeSlots = [];
      const startHour = 9;
      const endHour = 17;
      const duration = serviceData.estimated_duration;

      for (let hour = startHour; hour < endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        timeSlots.push({ time: timeString, available: true });
      }

      // Get existing bookings for the date and service
      const existingBookings = await db('bookings')
        .where('booking_date', date)
        .where('service', service)
        .whereNotIn('status', ['cancelled', 'no_show'])
        .select('booking_time', 'duration');

      // Mark time slots as unavailable if they conflict
      const availableSlots = timeSlots.map(slot => {
        const slotStart = parseInt(slot.time.split(':')[0]);
        const slotEnd = slotStart + (duration / 60);

        const hasConflict = existingBookings.some(booking => {
          const bookingHour = parseInt(booking.booking_time.split(':')[0]);
          const bookingEnd = bookingHour + (booking.duration / 60);
          
          return (slotStart < bookingEnd && slotEnd > bookingHour);
        });

        return {
          time: slot.time,
          available: !hasConflict
        };
      });

      return availableSlots;
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
      let query = db('bookings')
        .where('booking_date', '>=', startDate)
        .where('booking_date', '<=', endDate)
        .whereNotIn('status', ['cancelled', 'no_show'])
        .orderBy('booking_date', 'asc')
        .orderBy('booking_time', 'asc');

      if (technician) {
        query = query.where('assigned_technician', technician);
      }

      const bookings = await query;

      return bookings.map(this.mapDatabaseBookingToBooking);
    } catch (error) {
      throw new CustomError('Failed to fetch bookings by date range', 500);
    }
  }

  static async getBookingStats(
    startDate?: string,
    endDate?: string
  ): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }> {
    try {
      let query = db('bookings').select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['pending']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as confirmed', ['confirmed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed', ['completed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as cancelled', ['cancelled']),
        db.raw('COALESCE(SUM(CASE WHEN actual_cost IS NOT NULL THEN actual_cost ELSE estimated_cost END), 0) as revenue')
      );

      if (startDate) {
        query = query.where('booking_date', '>=', startDate);
      }

      if (endDate) {
        query = query.where('booking_date', '<=', endDate);
      }

      const [stats] = await query;

      return {
        total: parseInt(stats.total) || 0,
        pending: parseInt(stats.pending) || 0,
        confirmed: parseInt(stats.confirmed) || 0,
        completed: parseInt(stats.completed) || 0,
        cancelled: parseInt(stats.cancelled) || 0,
        revenue: parseFloat(stats.revenue) || 0,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch booking statistics', 500);
    }
  }

  private static mapDatabaseBookingToBooking(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      userId: dbBooking.user_id,
      service: dbBooking.service,
      serviceType: dbBooking.service_type,
      bookingDate: new Date(dbBooking.booking_date),
      bookingTime: dbBooking.booking_time,
      duration: dbBooking.duration,
      status: dbBooking.status,
      priority: dbBooking.priority,
      customerName: dbBooking.customer_name,
      customerPhone: dbBooking.customer_phone,
      customerEmail: dbBooking.customer_email,
      serviceAddress: dbBooking.service_address,
      serviceDescription: dbBooking.service_description,
      specialInstructions: dbBooking.special_instructions,
      estimatedCost: dbBooking.estimated_cost,
      actualCost: dbBooking.actual_cost,
      assignedTechnician: dbBooking.assigned_technician,
      notes: dbBooking.notes,
      createdAt: new Date(dbBooking.created_at),
      updatedAt: new Date(dbBooking.updated_at),
    };
  }
}