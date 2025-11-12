import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { Menu, X, Phone, Mail, MapPin, ShoppingCart, Calendar, Instagram, Facebook, MessageCircle, Home, Scissors, BookOpen, MessageSquare, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// =============================================================================
// TYPESCRIPT INTERFACES
// =============================================================================

interface BookingData {
  name: string;
  phone: string;
  email: string;
  service: string;
  serviceId: string;
  date: string;
  time: string;
  notes?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  available: boolean;
}

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// =============================================================================
// API SERVICE LAYER
// =============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Booking API
  async createBooking(data: BookingData) {
    return this.request<{ success: boolean; bookingId: string; message: string }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<TimeSlot[]> {
    return this.request<TimeSlot[]>(`/api/availability?date=${date}&serviceId=${serviceId}`);
  }

  async getCustomerBookings(customerId: string) {
    return this.request<BookingData[]>(`/api/bookings/customer/${customerId}`);
  }

  async cancelBooking(bookingId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  // Services API
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/services');
  }

  // Authentication API
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: RegisterData) {
    return this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/api/auth/me');
  }

  // Products API
  async getProducts() {
    return this.request<any[]>('/api/products');
  }

  // Contact API
  async submitContactForm(data: { name: string; email: string; phone: string; message: string }) {
    return this.request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const apiService = new ApiService();

// =============================================================================
// AUTHENTICATION CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token, user } = await apiService.login(email, password);
      localStorage.setItem('authToken', token);
      setUser(user);
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const { token, user } = await apiService.register(userData);
      localStorage.setItem('authToken', token);
      setUser(user);
    } catch (error) {
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validateBookingForm = (data: Partial<BookingData>): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.phone) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.service) {
    errors.service = 'Please select a service';
  }

  if (!data.date) {
    errors.date = 'Please select a date';
  }

  if (!data.time) {
    errors.time = 'Please select a time';
  }

  return errors;
};

// =============================================================================
// COMPONENTS
// =============================================================================

// Loading Spinner Component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-yellow-500`} />
    </div>
  );
};

// Error Message Component
const ErrorMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ 
  message, 
  onDismiss 
}) => (
  <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-4 flex items-center gap-3">
    <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
    <p className="text-red-300 text-sm flex-1">{message}</p>
    {onDismiss && (
      <button 
        onClick={onDismiss} 
        className="text-red-400 hover:text-red-300"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

// Success Message Component
const SuccessMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ 
  message, 
  onDismiss 
}) => (
  <div className="bg-green-900 border border-green-500 rounded-lg p-4 mb-4 flex items-center gap-3">
    <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
    <p className="text-green-300 text-sm flex-1">{message}</p>
    {onDismiss && (
      <button 
        onClick={onDismiss} 
        className="text-green-400 hover:text-green-300"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

// Form Input Component with Error Handling
interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
}) => (
  <div>
    <label className="block text-gray-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
        error 
          ? 'border-red-500 focus:border-red-400' 
          : 'border-gray-600 focus:border-yellow-500'
      }`}
    />
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

// Form Select Component
interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onChange,
  error,
  options,
  required = false,
}) => (
  <div>
    <label className="block text-gray-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
        error 
          ? 'border-red-500 focus:border-red-400' 
          : 'border-gray-600 focus:border-yellow-500'
      }`}
    >
      <option value="">Select an option</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AshlocksWebsite: React.FC = () => {
  // Core state management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  
  // Booking state
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    name: '',
    phone: '',
    email: '',
    service: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  
  // Contact form state
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  const { user, isAuthenticated } = useAuth();

  // Services data with backend integration
  const servicesData = useMemo(() => [
    {
      id: 'starter-locs',
      title: 'Starter Locs (Crochet)',
      description: 'Begin your loc journey with our expert crochet method for strong, beautiful starter locs.',
      duration: 180,
      price: 120,
      category: 'dreadlocks',
      available: true,
      icon: '🌟'
    },
    {
      id: 'sister-locs',
      title: 'Sister Locs (Micro Locs)',
      description: 'Delicate, versatile micro locs that offer styling flexibility and natural beauty.',
      duration: 240,
      price: 180,
      category: 'dreadlocks',
      available: true,
      icon: '✨'
    },
    {
      id: 'relocking',
      title: 'Re-locking & Extension',
      description: 'Maintain and enhance your locs with professional re-locking and extension services.',
      duration: 120,
      price: 80,
      category: 'dreadlocks',
      available: true,
      icon: '🔄'
    },
    {
      id: 'styling',
      title: 'Styling & Coloring',
      description: 'Transform your locs with creative styling and vibrant, safe color treatments.',
      duration: 150,
      price: 100,
      category: 'dreadlocks',
      available: true,
      icon: '🎨'
    },
    {
      id: 'washing',
      title: 'Washing & Treatment',
      description: 'Deep cleansing and nourishing treatments to keep your locs healthy and fresh.',
      duration: 90,
      price: 60,
      category: 'dreadlocks',
      available: true,
      icon: '💧'
    }
  ], []);

  const braidStyles = useMemo(() => [
    'Box Braids', 'Knotless Braids', 'Passion Twists', 'Cornrows', 
    'Goddess Braids', 'Fulani Braids', 'Feed-in Braids', 'Crochet Braids'
  ], []);

  const products = useMemo(() => [
    { id: 1, name: 'Loc Oil Premium Blend', price: '£15.99', image: '🌿' },
    { id: 2, name: 'Dreadlock Maintenance Kit', price: '£24.99', image: '🧰' },
    { id: 3, name: 'Natural Hair Butter', price: '£12.99', image: '🥥' },
    { id: 4, name: 'Loc Crochet Hook Set', price: '£18.99', image: '🪝' },
    { id: 5, name: 'Deep Conditioning Treatment', price: '£19.99', image: '💆' },
    { id: 6, name: 'Silk Loc Bonnet', price: '£9.99', image: '🎀' },
    { id: 7, name: 'Edge Control Gel', price: '£8.99', image: '✨' },
    { id: 8, name: 'Professional Scissors Set', price: '£29.99', image: '✂️' }
  ], []);

  // Load available slots when date or service changes
  useEffect(() => {
    if (bookingData.date && bookingData.serviceId) {
      loadAvailableSlots();
    }
  }, [bookingData.date, bookingData.serviceId]);

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const servicesData = await apiService.getServices();
      setServices(servicesData);
    } catch (err) {
      console.error('Failed to load services:', err);
      // Fallback to local data if API fails
      setServices(servicesData);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!bookingData.date || !bookingData.serviceId) return;

    try {
      setLoading(true);
      const slots = await apiService.getAvailableSlots(bookingData.date, bookingData.serviceId);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Failed to load available slots:', err);
      // Generate mock slots as fallback
      const mockSlots: TimeSlot[] = [
        { id: '1', start: '09:00', end: '10:00', available: true },
        { id: '2', start: '10:00', end: '11:00', available: true },
        { id: '3', start: '11:00', end: '12:00', available: false },
        { id: '4', start: '14:00', end: '15:00', available: true },
        { id: '5', start: '15:00', end: '16:00', available: true },
        { id: '6', start: '16:00', end: '17:00', available: true },
      ];
      setAvailableSlots(mockSlots);
    } finally {
      setLoading(false);
    }
  };

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Navigation
  const navigateToPage = useCallback((page: string) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Booking form handlers
  const updateBookingData = useCallback((field: keyof BookingData, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateBookingForm(bookingData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please correct the errors in the form');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.createBooking(bookingData as BookingData);
      
      if (response.success) {
        setShowBookingConfirm(true);
        setSuccess('Booking request submitted successfully! We will contact you shortly to confirm.');
        setBookingData({
          name: '',
          phone: '',
          email: '',
          service: '',
          serviceId: '',
          date: '',
          time: '',
          notes: '',
        });
        setFormErrors({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Contact form handler
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await apiService.submitContactForm(contactData);
      
      setSuccess('Message sent successfully! We will get back to you soon.');
      setContactData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Service options for form
  const serviceOptions = useMemo(() => 
    servicesData.map(service => ({
      value: service.id,
      label: `${service.title} - £${service.price} (${service.duration}min)`
    })), [servicesData]
  );

  // Available time options
  const timeOptions = useMemo(() => 
    availableSlots
      .filter(slot => slot.available)
      .map(slot => ({
        value: slot.start,
        label: `${slot.start} - ${slot.end}`
      })), [availableSlots]
  );

  // Menu items
  const menuItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'services', label: 'Services', icon: <Scissors size={18} /> },
    { id: 'store', label: 'Store', icon: <ShoppingCart size={18} /> },
    { id: 'booking', label: 'Booking', icon: <Calendar size={18} /> },
    { id: 'contact', label: 'Contact', icon: <MessageSquare size={18} /> }
  ], []);

  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  // Navigation Component
  const Navigation = () => (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black bg-opacity-95 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button onClick={() => navigateToPage('home')} className="text-2xl font-bold">
            <span className="text-yellow-500">ASH</span>
            <span className="text-white">LOCKS</span>
          </button>
          
          <div className="hidden md:flex space-x-8">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateToPage(item.id)}
                className={`flex items-center gap-2 transition-colors ${currentPage === item.id ? 'text-yellow-500' : 'text-white hover:text-yellow-500'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-yellow-500">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-black bg-opacity-98 border-t border-yellow-500">
          <div className="px-4 py-4 space-y-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => navigateToPage(item.id)}
                className="flex items-center gap-3 w-full text-left py-2 text-white hover:text-yellow-500 transition-colors"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );

  // Home Page
  const HomePage = () => (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-yellow-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2Q0YWYzNyIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-yellow-500">ASHLOCKS</span>
            <br />
            <span className="text-white">DREADLOCKS</span>
          </h1>
          <p className="text-2xl md:text-3xl text-yellow-400 mb-8 font-light">
            Stay Fresh | Stay Loc'd
          </p>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Professional dreadlocks, braids, haircuts & workshops in the UK
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigateToPage('booking')}
              className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg"
            >
              Book Appointment
            </button>
            <button 
              onClick={() => navigateToPage('services')}
              className="bg-transparent border-2 border-yellow-500 text-yellow-500 px-8 py-4 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-105"
            >
              View Services
            </button>
          </div>
        </div>
      </section>

      {/* Quick Info Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg hover:border-opacity-100 transition-all">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">Expert Locs</h3>
              <p className="text-gray-400">Professional dreadlock services with years of experience</p>
            </div>
            <div className="text-center p-8 bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg hover:border-opacity-100 transition-all">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">Premium Products</h3>
              <p className="text-gray-400">High-quality hair care products for healthy locs</p>
            </div>
            <div className="text-center p-8 bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg hover:border-opacity-100 transition-all">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">Training Available</h3>
              <p className="text-gray-400">Learn from professionals in our workshop programs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">Our</span> Services
            </h2>
            <p className="text-gray-400 text-lg">Excellence in every strand</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <button 
              onClick={() => navigateToPage('services')}
              className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-8 hover:border-opacity-100 transition-all transform hover:scale-105 text-left"
            >
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-3">Dreadlocks & Locs</h3>
              <p className="text-gray-400">Starter locs, sister locs, maintenance, styling & more</p>
            </button>

            <button 
              onClick={() => navigateToPage('services')}
              className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-8 hover:border-opacity-100 transition-all transform hover:scale-105 text-left"
            >
              <div className="text-6xl mb-4">💫</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-3">Braids & Twists</h3>
              <p className="text-gray-400">Box braids, knotless, cornrows & more styles</p>
            </button>

            <button 
              onClick={() => navigateToPage('services')}
              className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-8 hover:border-opacity-100 transition-all transform hover:scale-105 text-left"
            >
              <div className="text-6xl mb-4">✂️</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-3">Haircuts</h3>
              <p className="text-gray-400">Precision cuts for men and women</p>
            </button>

            <button 
              onClick={() => navigateToPage('services')}
              className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-8 hover:border-opacity-100 transition-all transform hover:scale-105 text-left"
            >
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-3">Workshops</h3>
              <p className="text-gray-400">Professional training programs available</p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // Services Page
  const ServicesPage = () => (
    <div className="pt-20">
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">Our</span> Services
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              From beautiful locs to intricate braids and precision cuts, we offer comprehensive hair artistry services
            </p>
          </div>

          {/* Dreadlocks */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-yellow-500">Dreadlock Services</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {servicesData.map((service) => (
                <div 
                  key={service.id}
                  className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-6 hover:border-opacity-100 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20"
                >
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-3">{service.title}</h3>
                  <p className="text-gray-400 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-yellow-400 font-semibold">£{service.price}</span>
                    <span className="text-gray-500">{service.duration}min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Braids */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-yellow-500">Braiding Styles</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {braidStyles.map((style, idx) => (
                <div 
                  key={idx}
                  className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-6 text-center hover:border-opacity-100 transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-3">💫</div>
                  <h3 className="text-white font-semibold">{style}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Haircuts */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-yellow-500">Haircuts</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-8 text-center hover:border-opacity-100 transition-all">
                <div className="text-6xl mb-4">✂️</div>
                <h3 className="text-2xl font-bold text-yellow-500 mb-3">Men's Cuts</h3>
                <p className="text-gray-400">Fades, tapers, and modern styles with precision</p>
                <p className="text-yellow-400 font-semibold mt-2">From £25</p>
              </div>
              <div className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-8 text-center hover:border-opacity-100 transition-all">
                <div className="text-6xl mb-4">💇</div>
                <h3 className="text-2xl font-bold text-yellow-500 mb-3">Women's Cuts</h3>
                <p className="text-gray-400">Elegant trims and creative styling options</p>
                <p className="text-yellow-400 font-semibold mt-2">From £30</p>
              </div>
            </div>
          </div>

          {/* Workshops */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-yellow-500">Training & Workshops</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">Beginner Program</h3>
                <ul className="space-y-3 text-gray-300 mb-6">
                  <li>• Introduction to dreadlock techniques</li>
                  <li>• Starter locs methods (crochet & twist)</li>
                  <li>• Basic maintenance and care</li>
                  <li>• Tools and product knowledge</li>
                  <li>• Certificate upon completion</li>
                </ul>
                <p className="text-yellow-400 font-semibold mb-4">£299</p>
                <button 
                  onClick={() => navigateToPage('booking')}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all w-full"
                >
                  Register Now
                </button>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-500 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-yellow-500 mb-4">Advanced Program</h3>
                <ul className="space-y-3 text-gray-300 mb-6">
                  <li>• Advanced styling techniques</li>
                  <li>• Sister locs and micro locs mastery</li>
                  <li>• Color application and treatments</li>
                  <li>• Business and client management</li>
                  <li>• Professional certification</li>
                </ul>
                <p className="text-yellow-400 font-semibold mb-4">£499</p>
                <button 
                  onClick={() => navigateToPage('booking')}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all w-full"
                >
                  Register Now
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <button 
              onClick={() => navigateToPage('booking')}
              className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-lg"
            >
              Book Your Service Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // Store Page
  const StorePage = () => (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-black to-gray-900">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">Our</span> Store
            </h1>
            <p className="text-gray-400 text-lg">
              Premium products for healthy, beautiful locs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-6 hover:border-opacity-100 transition-all transform hover:scale-105"
              >
                <div className="text-6xl mb-4 text-center">{product.image}</div>
                <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                <p className="text-yellow-500 text-xl font-bold mb-4">{product.price}</p>
                <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-all w-full flex items-center justify-center gap-2">
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-8 max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">Need Product Advice?</h3>
            <p className="text-gray-400 mb-6">
              Not sure which products are right for your locs? Contact us for personalized recommendations.
            </p>
            <button 
              onClick={() => navigateToPage('contact')}
              className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // Enhanced Booking Page
  const BookingPage = () => (
    <div className="pt-20 min-h-screen bg-gray-900">
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">Book</span> Appointment
            </h1>
            <p className="text-gray-400 text-lg">
              Reserve your slot with us today
            </p>
          </div>

          {/* Error and Success Messages */}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

          <div className="bg-black border border-yellow-500 border-opacity-30 rounded-lg p-8">
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                  label="Full Name"
                  type="text"
                  value={bookingData.name || ''}
                  onChange={(value) => updateBookingData('name', value)}
                  error={formErrors.name}
                  placeholder="Your name"
                  required
                />
                <FormInput
                  label="Phone"
                  type="tel"
                  value={bookingData.phone || ''}
                  onChange={(value) => updateBookingData('phone', value)}
                  error={formErrors.phone}
                  placeholder="+44"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                  label="Email"
                  type="email"
                  value={bookingData.email || ''}
                  onChange={(value) => updateBookingData('email', value)}
                  error={formErrors.email}
                  placeholder="your@email.com"
                  required
                />
                <FormInput
                  label="Additional Notes (Optional)"
                  type="text"
                  value={bookingData.notes || ''}
                  onChange={(value) => updateBookingData('notes', value)}
                  placeholder="Any special requests or notes"
                />
              </div>

              <FormSelect
                label="Service"
                value={bookingData.serviceId || ''}
                onChange={(value) => {
                  const selectedService = servicesData.find(s => s.id === value);
                  updateBookingData('serviceId', value);
                  updateBookingData('service', selectedService?.title || '');
                }}
                error={formErrors.service}
                options={serviceOptions}
                required
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormInput
                  label="Preferred Date"
                  type="date"
                  value={bookingData.date || ''}
                  onChange={(value) => updateBookingData('date', value)}
                  error={formErrors.date}
                  required
                />
                <FormSelect
                  label="Preferred Time"
                  value={bookingData.time || ''}
                  onChange={(value) => updateBookingData('time', value)}
                  error={formErrors.time}
                  options={timeOptions}
                  required
                />
              </div>

              {bookingData.serviceId && (
                <div className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-4">
                  <h4 className="text-yellow-500 font-semibold mb-2">Booking Summary</h4>
                  {(() => {
                    const selectedService = servicesData.find(s => s.id === bookingData.serviceId);
                    return selectedService ? (
                      <div className="space-y-1 text-sm text-gray-300">
                        <p><span className="text-yellow-400">Service:</span> {selectedService.title}</p>
                        <p><span className="text-yellow-400">Duration:</span> {selectedService.duration} minutes</p>
                        <p><span className="text-yellow-400">Price:</span> £{selectedService.price}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-black px-6 py-4 rounded-lg font-semibold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Calendar size={20} />
                    Confirm Booking
                  </>
                )}
              </button>

              {showBookingConfirm && (
                <div className="bg-green-900 border border-green-500 rounded-lg p-4 text-center">
                  <p className="text-green-300 font-semibold">
                    ✓ Booking request received! We'll contact you shortly to confirm.
                  </p>
                </div>
              )}
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-4">Prefer to book via phone or WhatsApp?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+447724500349"
                className="bg-gray-900 border border-yellow-500 text-yellow-500 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                Call: 07724 500349
              </a>
              <a 
                href="https://wa.me/447724500349"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Contact Page
  const ContactPage = () => (
    <div className="pt-20 min-h-screen bg-black">
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-yellow-500">Get In</span> Touch
            </h1>
            <p className="text-gray-400 text-lg">
              We'd love to hear from you
            </p>
          </div>

          {/* Error and Success Messages */}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Phone className="text-black" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-1">Phone</h3>
                  <p className="text-gray-300">07724 500349</p>
                  <a 
                    href="tel:+447724500349"
                    className="text-yellow-400 hover:text-yellow-300 text-sm"
                  >
                    Click to call
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <Mail className="text-black" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-1">Email</h3>
                  <p className="text-gray-300">ashlocks.uk@gmail.com</p>
                  <a 
                    href="mailto:ashlocks.uk@gmail.com"
                    className="text-yellow-400 hover:text-yellow-300 text-sm"
                  >
                    Send us an email
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <MapPin className="text-black" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-500 mb-1">Location</h3>
                  <p className="text-gray-300">United Kingdom</p>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-xl font-bold text-yellow-500 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a 
                    href="https://instagram.com/ashlocks" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-yellow-500 p-3 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-110"
                  >
                    <Instagram className="text-black" size={24} />
                  </a>
                  <a 
                    href="https://tiktok.com/@ashlocks" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-yellow-500 p-3 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://facebook.com/ashlocks" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-yellow-500 p-3 rounded-lg hover:bg-yellow-400 transition-all transform hover:scale-110"
                  >
                    <Facebook className="text-black" size={24} />
                  </a>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-xl font-bold text-yellow-500 mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-300">
                  <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                  <p>Saturday: 10:00 AM - 6:00 PM</p>
                  <p>Sunday: By Appointment Only</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-yellow-500 mb-6">Send us a message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <FormInput
                  label="Your Name"
                  value={contactData.name}
                  onChange={(value) => setContactData(prev => ({ ...prev, name: value }))}
                  placeholder="Your name"
                  required
                />
                <FormInput
                  label="Your Email"
                  type="email"
                  value={contactData.email}
                  onChange={(value) => setContactData(prev => ({ ...prev, email: value }))}
                  placeholder="your@email.com"
                  required
                />
                <FormInput
                  label="Your Phone"
                  type="tel"
                  value={contactData.phone}
                  onChange={(value) => setContactData(prev => ({ ...prev, phone: value }))}
                  placeholder="+44"
                />
                <div>
                  <label className="block text-gray-300 mb-2">
                    Your Message <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    rows={4}
                    value={contactData.message}
                    onChange={(e) => setContactData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Your message"
                    className="w-full bg-black border border-gray-600 focus:border-yellow-500 rounded-lg px-4 py-3 text-white focus:outline-none resize-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-16 bg-gray-900 border border-yellow-500 border-opacity-30 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-yellow-500 mb-4">Ready to Book?</h3>
            <p className="text-gray-400 mb-6">
              Schedule your appointment today and experience the Ashlocks difference
            </p>
            <button 
              onClick={() => navigateToPage('booking')}
              className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  // Footer Component
  const Footer = () => (
    <footer className="bg-black border-t border-yellow-500 border-opacity-30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-yellow-500">ASH</span>
              <span className="text-white">LOCKS</span>
            </h3>
            <p className="text-gray-400">Stay Fresh | Stay Loc'd</p>
          </div>

          <div>
            <h4 className="text-xl font-bold text-yellow-500 mb-4">Quick Links</h4>
            <div className="space-y-2">
              <button onClick={() => navigateToPage('home')} className="block text-gray-400 hover:text-yellow-500 transition-colors">Home</button>
              <button onClick={() => navigateToPage('services')} className="block text-gray-400 hover:text-yellow-500 transition-colors">Services</button>
              <button onClick={() => navigateToPage('store')} className="block text-gray-400 hover:text-yellow-500 transition-colors">Store</button>
              <button onClick={() => navigateToPage('booking')} className="block text-gray-400 hover:text-yellow-500 transition-colors">Booking</button>
              <button onClick={() => navigateToPage('contact')} className="block text-gray-400 hover:text-yellow-500 transition-colors">Contact</button>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-yellow-500 mb-4">Contact</h4>
            <div className="space-y-2 text-gray-400">
              <p>📞 07724 500349</p>
              <p>📧 ashlocks.uk@gmail.com</p>
              <p>📍 United Kingdom</p>
            </div>
          </div>
        </div>

        <div className="border-t border-yellow-500 border-opacity-30 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Ashlocks Dreadlocks. All rights reserved.
          </p>
          <p className="text-yellow-500 mt-2 font-semibold">
            Stay Fresh | Stay Loc'd
          </p>
        </div>
      </div>
    </footer>
  );

  // Render the appropriate page
  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <HomePage />;
      case 'services':
        return <ServicesPage />;
      case 'store':
        return <StorePage />;
      case 'booking':
        return <BookingPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-black text-white font-sans">
      <Navigation />
      {loading && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
      {renderPage()}
      <Footer />

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/447724500349"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all transform hover:scale-110 z-50 animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
      </a>

      {/* SEO Meta Tags - These would typically go in the document head */}
      <div style={{ display: 'none' }}>
        <meta name="title" content="Ashlocks Dreadlocks | Dreadlock & Hair Artistry UK" />
        <meta name="description" content="Professional dreadlocks, braids, haircuts, and workshops. Stay Fresh | Stay Loc'd with Ashlocks Dreadlocks." />
        <meta name="keywords" content="dreadlocks, braids, haircuts, hair artistry, UK, starter locs, sister locs, workshops" />
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

// Export wrapped with AuthProvider
const AshlocksWebsiteWithAuth: React.FC = () => (
  <AuthProvider>
    <AshlocksWebsite />
  </AuthProvider>
);

export default AshlocksWebsiteWithAuth;