import { ContactModel, NewsletterModel } from '../models/Contact';
import { CreateContactRequest, CreateNewsletterRequest, Contact, Newsletter } from '../types';
import { CustomError } from '../middleware/errorHandler';

export class ContactService {
  static async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      return await ContactModel.create(contactData);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create contact inquiry', 500);
    }
  }

  static async getAllContacts(
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
      return await ContactModel.findAll(page, limit, filters);
    } catch (error) {
      throw new CustomError('Failed to fetch contact inquiries', 500);
    }
  }

  static async getContactById(id: string): Promise<Contact | null> {
    try {
      return await ContactModel.findById(id);
    } catch (error) {
      throw new CustomError('Failed to fetch contact inquiry', 500);
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      return await ContactModel.update(id, updates);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update contact inquiry', 500);
    }
  }

  static async assignContact(id: string, assignedTo: string): Promise<Contact> {
    try {
      return await ContactModel.update(id, { assignedTo });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to assign contact inquiry', 500);
    }
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      await ContactModel.delete(id);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete contact inquiry', 500);
    }
  }
}

export class NewsletterService {
  static async subscribe(newsletterData: CreateNewsletterRequest): Promise<Newsletter> {
    try {
      return await NewsletterModel.create(newsletterData);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to subscribe to newsletter', 500);
    }
  }

  static async unsubscribe(email: string): Promise<void> {
    try {
      await NewsletterModel.unsubscribe(email);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to unsubscribe from newsletter', 500);
    }
  }

  static async getAllSubscribers(
    page: number = 1,
    limit: number = 10,
    filters: {
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ subscribers: Newsletter[]; total: number; totalPages: number }> {
    try {
      return await NewsletterModel.findAll(page, limit, filters);
    } catch (error) {
      throw new CustomError('Failed to fetch newsletter subscribers', 500);
    }
  }

  static async deleteSubscriber(id: string): Promise<void> {
    try {
      await NewsletterModel.delete(id);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete newsletter subscriber', 500);
    }
  }

  static async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const totalSubscribers = await NewsletterModel.findAll(1, 1);
      const activeSubscribers = await NewsletterModel.findAll(1, 1, { isActive: true });
      const inactiveSubscribers = await NewsletterModel.findAll(1, 1, { isActive: false });

      return {
        total: totalSubscribers.total,
        active: activeSubscribers.total,
        inactive: inactiveSubscribers.total,
      };
    } catch (error) {
      throw new CustomError('Failed to fetch newsletter statistics', 500);
    }
  }
}