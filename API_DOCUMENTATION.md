# Ashlocks Backend API Documentation

The Ashlocks backend API provides a complete set of endpoints for managing bookings, services, users, and customer communications.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-api-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- Contact forms: 10 requests per hour
- Bookings: 20 requests per hour

## Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]
}
```

Paginated responses:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0123",
  "role": "customer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  },
  "message": "User registered successfully"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-0456"
}
```

### Change Password
```http
PUT /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

## Booking Endpoints

### Create Booking
```http
POST /api/bookings
Content-Type: application/json

{
  "service": "Lock Installation",
  "serviceType": "lock_installation",
  "bookingDate": "2024-03-15",
  "bookingTime": "10:00",
  "customerName": "John Doe",
  "customerPhone": "+1-555-0123",
  "customerEmail": "john@example.com",
  "serviceAddress": "123 Main St, City, State 12345",
  "serviceDescription": "Need deadbolt installation on front door",
  "specialInstructions": "Please call 30 minutes before arrival",
  "priority": "medium"
}
```

### Get User Bookings
```http
GET /api/bookings/my-bookings
Authorization: Bearer <token>
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 10)
```

### Get All Bookings (Admin/Staff)
```http
GET /api/bookings
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - status: pending|confirmed|in_progress|completed|cancelled|no_show
  - serviceType: lock_installation|lock_repair|lock_maintenance|emergency_service
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - customerEmail: string
  - assignedTechnician: string
```

### Check Availability
```http
GET /api/bookings/availability/{service}?date=2024-03-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "Lock Installation",
    "date": "2024-03-15",
    "availableSlots": [
      { "time": "09:00", "available": true },
      { "time": "10:00", "available": false },
      { "time": "11:00", "available": true }
    ]
  }
}
```

### Update Booking Status (Admin/Staff)
```http
PUT /api/bookings/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Customer confirmed appointment"
}
```

## Service Endpoints

### Get All Services
```http
GET /api/services
Query Parameters:
  - page: number
  - limit: number
  - category: installation|repair|maintenance|emergency
  - search: string
```

### Get Available Services
```http
GET /api/services/available
```

### Get Services by Category
```http
GET /api/services/category/{category}
```

### Create Service (Admin/Staff)
```http
POST /api/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "High Security Lock",
  "description": "Premium security lock installation",
  "category": "installation",
  "basePrice": 250.00,
  "estimatedDuration": 180,
  "requirements": ["High security preference", "Additional locking mechanism"]
}
```

## Contact Endpoints

### Create Contact Inquiry
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0123",
  "subject": "Service Inquiry",
  "message": "I need help with my lock installation",
  "priority": "medium"
}
```

### Get All Contacts (Admin/Staff)
```http
GET /api/contacts
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - status: new|in_progress|resolved|closed
  - priority: low|medium|high
  - assignedTo: string
  - search: string
```

### Respond to Contact (Admin/Staff)
```http
PUT /api/contacts/{id}/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": "Thank you for your inquiry. We will contact you within 24 hours.",
  "status": "resolved"
}
```

## Newsletter Endpoints

### Subscribe to Newsletter
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "subscriber@example.com"
}
```

### Unsubscribe from Newsletter
```http
POST /api/newsletter/unsubscribe
Content-Type: application/json

{
  "email": "subscriber@example.com"
}
```

## User Management Endpoints (Admin/Staff)

### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - role: customer|admin|staff
  - isActive: boolean
  - search: string
```

### Update User Role
```http
PUT /api/users/{id}/change-role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

### Activate/Deactivate User
```http
PUT /api/users/{id}/activate
PUT /api/users/{id}/deactivate
Authorization: Bearer <token>
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Status Codes

### Booking Status
- `pending` - Booking submitted, awaiting confirmation
- `confirmed` - Booking confirmed by staff
- `in_progress` - Service is being performed
- `completed` - Service completed successfully
- `cancelled` - Booking cancelled by customer or staff
- `no_show` - Customer didn't show up

### Contact Status
- `new` - New inquiry, not yet assigned
- `in_progress` - Currently being addressed
- `resolved` - Issue resolved, customer responded to
- `closed` - Contact closed, no further action needed

### Priority Levels
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `emergency` - Emergency priority (bookings only)

## Testing

### Using curl

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Get profile
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Create a new collection
2. Set base URL to `http://localhost:3001/api`
3. Add authentication token to requests
4. Test all endpoints with sample data

## Environment Variables

Required environment variables for the API:

```env
# Server
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Ashlocks <noreply@ashlocks.com>

# URLs
FRONTEND_URL=https://your-frontend-url.com
API_BASE_URL=https://your-api-url.com
```

## Support

For API support or questions:
- Check the health endpoint: `/health`
- Review application logs
- Contact development team

## Versioning

API versioning is handled through the URL path. Current version: `v1`