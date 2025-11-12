// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'staff';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: string;
}

// Booking types
export interface Booking {
  id: string;
  userId: string;
  service: string;
  serviceType: 'lock_installation' | 'lock_repair' | 'lock_maintenance' | 'emergency_service';
  bookingDate: Date;
  bookingTime: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceAddress: string;
  serviceDescription?: string;
  specialInstructions?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedTechnician?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  service: string;
  serviceType: 'lock_installation' | 'lock_repair' | 'lock_maintenance' | 'emergency_service';
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceAddress: string;
  serviceDescription?: string;
  specialInstructions?: string;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
}

export interface UpdateBookingRequest {
  status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  bookingDate?: string;
  bookingTime?: string;
  serviceDescription?: string;
  specialInstructions?: string;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
  estimatedCost?: number;
  actualCost?: number;
  assignedTechnician?: string;
  notes?: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  category: 'installation' | 'repair' | 'maintenance' | 'emergency';
  basePrice: number;
  estimatedDuration: number; // in minutes
  isActive: boolean;
  isAvailableForBooking: boolean;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  category: 'installation' | 'repair' | 'maintenance' | 'emergency';
  basePrice: number;
  estimatedDuration: number;
  isActive?: boolean;
  isAvailableForBooking?: boolean;
  requirements?: string[];
}

// Contact types
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request with user
export interface RequestWithUser extends Request {
  user?: User;
}

// Error types
export interface AppError {
  statusCode: number;
  message: string;
  details?: any;
}

// JWT payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Availability types
export interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  duration: number;
  service: string;
}

// Newsletter types
export interface Newsletter {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
}

export interface CreateNewsletterRequest {
  email: string;
}