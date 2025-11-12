# Ashlocks Backend - Production-Ready API

A comprehensive, production-ready Node.js/Express backend API for the Ashlocks lock service booking system. This backend provides complete functionality for managing bookings, services, users, and customer communications.

## 🚀 Features

### Core Functionality
- **User Authentication** - JWT-based auth with registration, login, password reset
- **Booking Management** - Complete booking system with availability checking
- **Service Management** - CRUD operations for services and pricing
- **Contact Management** - Customer inquiries and response system
- **Newsletter System** - Email subscription and management
- **User Management** - Admin panel for user administration

### Production Features
- **TypeScript** - Full type safety throughout the application
- **PostgreSQL Database** - Relational database with migrations and seeds
- **Rate Limiting** - API rate limiting to prevent abuse
- **Input Validation** - Comprehensive request validation
- **Error Handling** - Professional error handling and logging
- **Security** - CORS, Helmet, and security best practices
- **Health Monitoring** - Health check endpoint for monitoring
- **Docker Support** - Complete containerization for deployment

### API Endpoints
- **Authentication**: `/api/auth/*` - Register, login, profile management
- **Bookings**: `/api/bookings/*` - Create, view, update, cancel bookings
- **Services**: `/api/services/*` - Service management and availability
- **Contacts**: `/api/contacts/*` - Customer inquiries and responses
- **Users**: `/api/users/*` - User management (admin only)
- **Newsletter**: `/api/newsletter/*` - Email subscription management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v13.0 or higher) or **Docker**

## 🛠️ Quick Start

### Method 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE ashlocks_dev;
   CREATE USER ashlocks_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ashlocks_dev TO ashlocks_user;
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

### Method 2: Docker Development

1. **Clone and start with Docker Compose**
   ```bash
   git clone <your-repository-url>
   cd backend
   docker-compose up -d
   ```

This will automatically start:
- PostgreSQL database
- Redis (for caching)
- Backend API server
- Frontend (optional)

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── migrations/      # Database migrations
│   ├── seeds/           # Database seed data
│   └── server.ts        # Main application file
├── logs/                # Log files
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── package.json         # Dependencies and scripts
```

## 🏃 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🔧 Environment Configuration

### Development (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ashlocks_dev
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-production-db-host
DB_NAME=ashlocks_production
DB_USER=your-prod-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-domain.com
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Joi-based request validation
- **CORS Protection** - Configurable cross-origin policies
- **Security Headers** - Helmet.js for HTTP headers
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Input sanitization

## 📊 Database Schema

### Main Tables
- **users** - User accounts and authentication
- **services** - Available lock services
- **bookings** - Service bookings and appointments
- **contacts** - Customer inquiries
- **newsletter_subscribers** - Email newsletter subscriptions

### Relationships
- Users can have multiple bookings
- Services can have multiple bookings
- Bookings reference services and users

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings (admin)
- `GET /api/bookings/my-bookings` - Get user bookings
- `PUT /api/bookings/:id` - Update booking (admin)
- `DELETE /api/bookings/:id` - Cancel booking

### Services
- `GET /api/services` - Get all services
- `GET /api/services/available` - Get available services
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)

## 🚢 Deployment

### Docker Deployment
```bash
# Build production image
docker build -t ashlocks-backend .

# Run container
docker run -d --name ashlocks-backend -p 3001:3001 ashlocks-backend
```

### Cloud Deployment Options

1. **Railway.app** (Recommended for beginners)
   ```bash
   railway init
   railway up
   ```

2. **Vercel** (Great for serverless)
   ```bash
   vercel --prod
   ```

3. **DigitalOcean** (Full control)
   ```bash
   # Deploy to Droplet
   scp -r dist/ user@your-server:/var/www/ashlocks
   ```

4. **AWS/GCP/Azure** (Enterprise)

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## 🧪 Testing

### API Testing with curl

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Create booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"service":"Lock Installation","serviceType":"lock_installation","bookingDate":"2024-03-15","bookingTime":"10:00","customerName":"John Doe","customerPhone":"+1-555-0123","customerEmail":"john@example.com","serviceAddress":"123 Main St"}'
```

### Health Check
```bash
curl http://localhost:3001/health
```

## 📈 Monitoring

- **Health Endpoint**: `/health` - Application status
- **Logging**: Winston for structured logging
- **Error Tracking**: Built-in error handling
- **Database Monitoring**: Connection pooling and health checks

## 🔧 Configuration

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Contact forms: 10 requests per hour
- Bookings: 20 requests per hour

### CORS
- Configured for frontend domain
- Credentials support
- Preflight handling

### Database
- Connection pooling
- Migration system
- Seed data
- Health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the health endpoint
- Review application logs
- See API documentation
- Contact development team

## 🎯 Next Steps

After setting up the backend:

1. **Set up the frontend** - Deploy the React frontend
2. **Configure email** - Set up SMTP for notifications
3. **Domain setup** - Configure custom domains
4. **SSL certificate** - Enable HTTPS
5. **Monitoring** - Set up application monitoring
6. **Backups** - Configure database backups
7. **CI/CD** - Set up automated deployment

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Detailed deployment instructions
- [Frontend Repository](../frontend/) - React frontend code
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Built with ❤️ for the Ashlocks booking system**