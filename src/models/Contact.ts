import db from '../config/database';
import { Contact, CreateContactRequest, Newsletter, CreateNewsletterRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class ContactModel {
  static async create(contactData: CreateContactRequest): Promise<Contact> {
    try {
      const [contact] = await db('contacts')
        .insert({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          subject: contactData.subject,
          message: contactData.message,
          priority: contactData.priority || 'medium',
        })
        .returning(['*']);

      return this.mapDatabaseContactToContact(contact);
    } catch (error) {
      throw new CustomError('Failed to create contact', 500);
    }
  }

  static async findById(id: string): Promise<Contact | null> {
    try {
      const contact = await db('contacts')
        .where('id', id)
        .first();

      if (!contact) {
        return null;
      }

      return this.mapDatabaseContactToContact(contact);
    } catch (error) {
      throw new CustomError('Failed to fetch contact', 500);
    }
  }

  static async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const updateData: any = {
        updated_at: new Date(),
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.response) {
        updateData.response = updates.response;
        updateData.responded_at = new Date();
      }

      const [contact] = await db('contacts')
        .where('id', id)
        .update(updateData)
        .returning(['*']);

      if (!contact) {
        throw new CustomError('Contact not found', 404);
      }

      return this.mapDatabaseContactToContact(contact);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update contact', 500);
    }
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      status?: string;
      priority?: string;
      assignedTo?: string;
      search?: string;
    } = {}
  ): Promise<{ contacts: Contact[]; total: number; totalPages: number }> {
    try {
      let query = db('contacts').select('*');
      let countQuery = db('contacts').count('* as count');

      // Apply filters
      if (filters.status) {
        query = query.where('status', filters.status);
        countQuery = countQuery.where('status', filters.status);
      }

      if (filters.priority) {
        query = query.where('priority', filters.priority);
        countQuery = countQuery.where('priority', filters.priority);
      }

      if (filters.assignedTo) {
        query = query.where('assigned_to', filters.assignedTo);
        countQuery = countQuery.where('assigned_to', filters.assignedTo);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(function() {
          this.where('name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm)
            .orWhere('subject', 'like', searchTerm)
            .orWhere('message', 'like', searchTerm);
        });
        countQuery = countQuery.where(function() {
          this.where('name', 'like', searchTerm)
            .orWhere('email', 'like', searchTerm)
            .orWhere('subject', 'like', searchTerm)
            .orWhere('message', 'like', searchTerm);
        });
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.orderBy('created_at', 'desc').limit(limit).offset(offset);

      // Execute queries
      const [contacts, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        contacts: contacts.map(this.mapDatabaseContactToContact),
        total,
        totalPages,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch contacts', 500);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const [contact] = await db('contacts')
        .where('id', id)
        .update({
          updated_at: new Date(),
        })
        .returning(['*']);

      if (!contact) {
        throw new CustomError('Contact not found', 404);
      }

      // Soft delete by marking as closed
      await db('contacts')
        .where('id', id)
        .update({
          status: 'closed',
          updated_at: new Date(),
        });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete contact', 500);
    }
  }

  private static mapDatabaseContactToContact(dbContact: any): Contact {
    return {
      id: dbContact.id,
      name: dbContact.name,
      email: dbContact.email,
      phone: dbContact.phone,
      subject: dbContact.subject,
      message: dbContact.message,
      status: dbContact.status,
      priority: dbContact.priority,
      assignedTo: dbContact.assigned_to,
      response: dbContact.response,
      createdAt: new Date(dbContact.created_at),
      updatedAt: new Date(dbContact.updated_at),
    };
  }
}

export class NewsletterModel {
  static async create(newsletterData: CreateNewsletterRequest): Promise<Newsletter> {
    try {
      const [subscriber] = await db('newsletter_subscribers')
        .insert({
          email: newsletterData.email,
        })
        .returning(['*']);

      return this.mapDatabaseNewsletterToNewsletter(subscriber);
    } catch (error: any) {
      if (error.code === '23505') {
        // Email already exists, check if active or inactive
        const existing = await db('newsletter_subscribers')
          .where('email', newsletterData.email)
          .first();

        if (existing && existing.is_active) {
          throw new CustomError('Email already subscribed to newsletter', 409);
        } else if (existing && !existing.is_active) {
          // Reactivate subscription
          const [reactivated] = await db('newsletter_subscribers')
            .where('email', newsletterData.email)
            .update({
              is_active: true,
              unsubscribed_at: null,
              updated_at: new Date(),
            })
            .returning(['*']);

          return this.mapDatabaseNewsletterToNewsletter(reactivated);
        }
      }
      throw new CustomError('Failed to subscribe to newsletter', 500);
    }
  }

  static async findByEmail(email: string): Promise<Newsletter | null> {
    try {
      const subscriber = await db('newsletter_subscribers')
        .where('email', email)
        .first();

      if (!subscriber) {
        return null;
      }

      return this.mapDatabaseNewsletterToNewsletter(subscriber);
    } catch (error) {
      throw new CustomError('Failed to fetch newsletter subscriber', 500);
    }
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ subscribers: Newsletter[]; total: number; totalPages: number }> {
    try {
      let query = db('newsletter_subscribers').select('*');
      let countQuery = db('newsletter_subscribers').count('* as count');

      // Apply filters
      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
        countQuery = countQuery.where('is_active', filters.isActive);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where('email', 'like', searchTerm);
        countQuery = countQuery.where('email', 'like', searchTerm);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.orderBy('subscribed_at', 'desc').limit(limit).offset(offset);

      // Execute queries
      const [subscribers, countResult] = await Promise.all([
        query,
        countQuery.first()
      ]);

      const total = parseInt(countResult?.count || '0');
      const totalPages = Math.ceil(total / limit);

      return {
        subscribers: subscribers.map(this.mapDatabaseNewsletterToNewsletter),
        total,
        totalPages,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch newsletter subscribers', 500);
    }
  }

  static async unsubscribe(email: string): Promise<void> {
    try {
      const [subscriber] = await db('newsletter_subscribers')
        .where('email', email)
        .update({
          is_active: false,
          unsubscribed_at: new Date(),
          updated_at: new Date(),
        })
        .returning(['*']);

      if (!subscriber) {
        throw new CustomError('Newsletter subscriber not found', 404);
      }
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to unsubscribe from newsletter', 500);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const [subscriber] = await db('newsletter_subscribers')
        .where('id', id)
        .update({
          updated_at: new Date(),
        })
        .returning(['*']);

      if (!subscriber) {
        throw new CustomError('Newsletter subscriber not found', 404);
      }

      await db('newsletter_subscribers')
        .where('id', id)
        .delete();
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete newsletter subscriber', 500);
    }
  }

  private static mapDatabaseNewsletterToNewsletter(dbSubscriber: any): Newsletter {
    return {
      id: dbSubscriber.id,
      email: dbSubscriber.email,
      isActive: dbSubscriber.is_active,
      subscribedAt: new Date(dbSubscriber.subscribed_at),
      unsubscribedAt: dbSubscriber.unsubscribed_at ? new Date(dbSubscriber.unsubscribed_at) : undefined,
    };
  }
}