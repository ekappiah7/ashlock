# Ashlocks Backend - Deployment Guide

This guide provides step-by-step instructions for deploying the Ashlocks backend application both locally and in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn**
- **PostgreSQL** (v13.0 or higher) or **Docker**
- **Git**

## Local Development Setup

### Method 1: Manual Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   - Create a new database: `ashlocks_dev`
   - Create a user with appropriate permissions

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and service configurations
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

### Method 2: Docker Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd backend
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

This will start:
- PostgreSQL database
- Redis (for caching)
- Backend API server
- Frontend (optional)

### Method 3: Full Stack Development

1. **Clone both repositories**
   ```bash
   git clone <your-frontend-repo> frontend
   git clone <your-backend-repo> backend
   ```

2. **Start full stack with Docker**
   ```bash
   cd backend
   docker-compose --profile frontend up -d
   ```

The full stack will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Production Deployment

### Option 1: Docker Deployment

1. **Build the production image**
   ```bash
   docker build -t ashlocks-backend .
   ```

2. **Run with production environment**
   ```bash
   docker run -d \
     --name ashlocks-backend \
     --restart unless-stopped \
     -p 3001:3001 \
     --env-file .env.production \
     ashlocks-backend
   ```

### Option 2: Cloud Platform Deployment

#### Railway.app Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add postgresql
   ```

5. **Deploy**
   ```bash
   railway up
   ```

#### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

#### AWS/GCP/Azure Deployment

For production-grade deployments, consider using:
- **AWS**: ECS, Elastic Beanstalk, or EC2
- **Google Cloud**: Cloud Run or App Engine
- **Azure**: Container Instances or App Service

## Environment Configuration

### Development Environment (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ashlocks_dev
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_REFRESH_SECRET=your-super-secret-refresh-key-for-development

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
```

### Production Environment (.env.production)

```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration (use environment variables from your platform)
DB_HOST=${DB_HOST}
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# URLs (update with your production domain)
FRONTEND_URL=https://your-frontend-domain.com
API_BASE_URL=https://your-backend-domain.com

# Security
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Database Setup

### Using Docker

1. **Start PostgreSQL container**
   ```bash
   docker run -d \
     --name postgres-ashlocks \
     -e POSTGRES_DB=ashlocks_production \
     -e POSTGRES_USER=ashlocks_user \
     -e POSTGRES_PASSWORD=secure_password_here \
     -p 5432:5432 \
     postgres:15
   ```

2. **Run migrations**
   ```bash
   npm run migrate
   ```

### Using Cloud Database

#### Railway PostgreSQL
- Create project with PostgreSQL addon
- Database URL will be provided automatically
- Update your .env with the connection string

#### PlanetScale (MySQL alternative)
- Create database and connection
- Use connection string in environment variables

## Deployment Options

### Recommended Production Stack

1. **Backend**: Railway.app, Vercel, or DigitalOcean App Platform
2. **Database**: Railway PostgreSQL, Supabase, or PlanetScale
3. **Frontend**: Vercel, Netlify, or GitHub Pages
4. **Email**: SendGrid, Mailgun, or Resend
5. **Domain**: Namecheap, GoDaddy, or Cloudflare

### Cost-Effective Options

- **Development/Staging**: Railway.app (free tier)
- **Production**: DigitalOcean Droplet ($4-6/month)
- **Database**: Railway PostgreSQL ($5/month)
- **Email**: SendGrid (free up to 300 emails/day)

## Monitoring and Maintenance

### Health Checks

The application provides a health check endpoint at `/health`:

```bash
curl http://localhost:3001/health
```

### Logging

Logs are written to:
- Development: Console output
- Production: `logs/error.log` and `logs/combined.log`

### Backup Strategy

1. **Database Backups**
   ```bash
   # Using pg_dump
   pg_dump -h your-db-host -U your-user -d your-db > backup.sql
   ```

2. **Automated Backups**
   - Set up cron jobs for daily backups
   - Use cloud provider backup services
   - Store backups in object storage (S3, GCS)

### Performance Monitoring

1. **Application Performance**
   - Use services like New Relic, DataDog, or Sentry
   - Monitor response times, error rates, and resource usage

2. **Database Performance**
   - Monitor query performance
   - Set up slow query logging
   - Regular database maintenance

### Security Checklist

- [ ] Use strong, unique passwords for all accounts
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Regular security audits

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process using port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database connection issues**
   - Check database credentials
   - Verify network connectivity
   - Ensure database is running

3. **JWT token issues**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings

4. **CORS errors**
   - Update CORS_ORIGIN in environment variables
   - Check frontend domain configuration

### Getting Help

- Check application logs: `docker logs ashlocks-backend`
- Monitor database status
- Review health check endpoint
- Check environment variable configuration

## Next Steps

After successful deployment:

1. **Set up domain names** for frontend and backend
2. **Configure SSL certificates** (usually automatic with platforms)
3. **Set up monitoring and alerts**
4. **Configure backup schedules**
5. **Test all functionality** in production environment
6. **Set up CI/CD pipeline** for automated deployments

Remember to keep your deployment credentials secure and never commit them to version control!