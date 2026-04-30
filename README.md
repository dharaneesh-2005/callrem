# Student Fee Manager

A comprehensive student fee management system with AI-powered voice reminders, automated payment processing, and intelligent conversation handling.

## Overview

Student Fee Manager is a full-stack web application designed for educational institutions to streamline fee collection, payment tracking, and automated communication with students. The system features an AI-powered voice assistant that can conduct natural conversations in multiple languages, answer queries about fees and courses, and send automated payment reminders via phone calls.

## Key Features

### Core Functionality
- **Student Management** - Complete student database with contact information and enrollment tracking
- **Course Management** - Course catalog with fee structures and duration management
- **Fee Assignment** - Link students to courses with automatic fee calculation
- **Payment Processing** - Multi-channel payment support (online, cash, bank transfer, cheque)
- **Dashboard Analytics** - Real-time statistics, revenue tracking, and payment status overview

### AI-Powered Voice System
- **Conversational AI** - Natural language understanding powered by Groq LLM
- **Voice Calls** - Automated phone calls via Twilio with text-to-speech
- **Multi-language Support** - Conversations in English and Tamil with automatic language detection
- **Intent Classification** - Smart routing based on conversation context
- **Script-based Reminders** - Simple TTS reminders for bulk notifications
- **Interactive Conversations** - AI-driven dialogues for complex queries

### Communication Features
- **Individual Reminders** - Send personalized voice reminders to specific students
- **Bulk Reminders** - Mass notification system for all pending payments
- **Scheduled Reminders** - Set future reminder dates with automated execution
- **Call Logging** - Complete history of all voice interactions
- **Conversation Transcripts** - Detailed logs of AI conversations with students

### Security & Authentication
- **JWT Authentication** - Secure token-based authentication
- **Two-Factor Authentication** - Optional TOTP-based 2FA for admin accounts
- **Password Hashing** - Bcrypt encryption for user credentials
- **Session Management** - Secure session handling with configurable expiry

## Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Relational database
- **Neon** - Serverless PostgreSQL hosting
- **Bcrypt** - Password hashing
- **Speakeasy** - TOTP implementation
- **JWT** - Token-based authentication

### External Services & APIs
- **Groq** - Fast LLM inference for conversational AI
- **Twilio** - Voice calls, TTS, and speech recognition
- **Razorpay** - Payment gateway integration
- **Neon Database** - Serverless PostgreSQL hosting

## Architecture

### System Design
```
┌─────────────┐
│   Client    │ (React SPA)
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Nginx     │ (Reverse Proxy)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Express   │ (API Server)
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│ PostgreSQL  │  │ External APIs│
│   (Neon)    │  │ - Groq       │
└─────────────┘  │ - Twilio     │
                 │ - Razorpay   │
                 └──────────────┘
```

### Voice Call Flow
```
1. User initiates call → Express API
2. Express creates Twilio call
3. Twilio calls student's phone
4. Student answers → Twilio webhook
5. Webhook triggers AI conversation
6. Groq processes speech → generates response
7. Twilio speaks response (TTS)
8. Conversation continues until completion
9. Call log and transcript saved to database
```

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- PostgreSQL database (or Neon account)
- Twilio account with phone number
- Razorpay account (test or live mode)
- Groq API key

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/student-fee-manager.git
cd student-fee-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
PGDATABASE=your_database_name
PGHOST=your_database_host
PGPORT=5432
PGUSER=your_database_user
PGPASSWORD=your_database_password

# Authentication
SESSION_SECRET=your_random_session_secret_min_32_chars
JWT_SECRET=your_random_jwt_secret_min_32_chars

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
VITE_RAZORPAY_KEY_ID=rzp_test_or_live_key_id

# Voice & AI (Twilio + Groq)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
GROQ_API_KEY=gsk_your_groq_api_key

# Optional: Google Voice (if using alternative provider)
GOOGLE_EMAIL=your_email@gmail.com
GOOGLE_PASSWORD=your_app_password

# Application URL (for webhooks)
PUBLIC_URL=https://yourdomain.com
```

### 4. Database Setup

Push the database schema:

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables

Ensure all environment variables are set in your production environment. Never commit `.env` files to version control.

### Recommended Platforms

- **Google Cloud Platform** - Compute Engine (e2-micro for free tier)
- **AWS** - EC2 (t2.micro for free tier)
- **Render** - Web Service with PostgreSQL
- **Railway** - Full-stack deployment
- **Vercel/Netlify** - Frontend only (requires separate backend)

## Usage Guide

### Initial Setup

1. **First Admin Registration**
   - Navigate to the application URL
   - Click "Register" to create the first admin account
   - No admin key required for the first user
   - Subsequent registrations require admin privileges

2. **Two-Factor Authentication (Optional)**
   - Go to Settings after login
   - Click "Setup 2FA"
   - Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
   - Enter verification code to confirm
   - Save backup codes securely

3. **Configure Webhook URLs**
   - Set `PUBLIC_URL` in `.env` to your domain
   - Configure Twilio webhook: `https://yourdomain.com/api/voice/incoming`
   - Configure Razorpay webhook: `https://yourdomain.com/api/payments/webhook`

### Managing Courses

1. Navigate to "Courses" section
2. Click "Add Course"
3. Enter course details:
   - Course name
   - Fee amount
   - Duration (in months)
   - Description (optional)
4. Save course

### Managing Students

1. Navigate to "Students" section
2. Click "Add Student"
3. Enter student information:
   - Full name
   - Phone number (with country code)
   - Email address
   - Address
4. Assign courses to student
5. System automatically creates fee records

### Processing Payments

#### Online Payments (Razorpay)
1. Student selects "Pay Online" option
2. Razorpay checkout modal opens
3. Student completes payment
4. System verifies payment signature
5. Payment record created automatically
6. Receipt generated and displayed

#### Offline Payments
1. Navigate to student's fee record
2. Click "Record Payment"
3. Select payment method:
   - Cash
   - Cheque
   - Bank Transfer
4. Enter amount and transaction details
5. Add notes (optional)
6. Save payment record

### Voice Reminder System

#### Individual Reminders

**AI Conversational Mode:**
1. Go to "Voice Management" section
2. Select student from list
3. Click "Initiate Call"
4. System creates Twilio call
5. AI assistant conducts conversation
6. Student can ask questions about fees, courses, payment methods
7. Conversation logged with full transcript

**Script-based Mode:**
1. Go to "Reminders" section
2. Customize reminder script template
3. Select student
4. Click "Send Script & End Call"
5. System reads script and hangs up
6. Ideal for simple payment reminders

#### Bulk Reminders

1. Navigate to "Reminders" section
2. Click "Send Bulk Reminders"
3. Configure reminder:
   - Select language (English/Tamil)
   - Customize message template
   - Choose script-based or conversational mode
4. System sends reminders to all students with pending fees
5. Progress tracked in real-time

#### Scheduled Reminders

1. Go to "Reminders" section
2. Click "Schedule Reminder"
3. Set date and time
4. Configure message and language
5. System automatically sends at scheduled time
6. Background scheduler handles execution

### AI Conversation Capabilities

The AI assistant can handle:

- **Fee Inquiries**: "How much do I owe?"
- **Payment Status**: "Did you receive my payment?"
- **Course Information**: "What courses am I enrolled in?"
- **Payment Methods**: "How can I pay my fees?"
- **Due Dates**: "When is my payment due?"
- **General Support**: "I need help with my account"

The system uses intent classification to route conversations appropriately and maintains context throughout the call.

### Monitoring & Analytics

#### Dashboard
- Total revenue collected
- Pending payments amount
- Number of students
- Recent payment activity
- Payment status distribution

#### Call Logs
- View all voice call history
- Filter by date, status, student
- Listen to call recordings (if enabled)
- Review conversation transcripts

#### Payment Reports
- Export payment data
- Filter by date range, course, status
- Generate financial reports
- Track payment trends

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new admin user.

**Request Body:**
```json
{
  "username": "admin",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "securepassword",
  "totpToken": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "twoFactorEnabled": false
  }
}
```

#### POST `/api/auth/setup-2fa`
Setup two-factor authentication.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "secret": "base32_secret",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", ...]
}
```

#### GET `/api/auth/user`
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "twoFactorEnabled": true
}
```

### Student Management

#### GET `/api/students`
List all students with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "address": "123 Main St"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 2
}
```

#### POST `/api/students`
Create a new student.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "address": "123 Main St"
}
```

#### PUT `/api/students/:id`
Update student information.

#### DELETE `/api/students/:id`
Delete a student and associated records.

### Course Management

#### GET `/api/courses`
List all courses.

#### POST `/api/courses`
Create a new course.

**Request Body:**
```json
{
  "name": "Computer Science",
  "feeAmount": 50000,
  "duration": 12,
  "description": "Full-stack development course"
}
```

### Fee Management

#### GET `/api/student-fees`
List all fee assignments.

**Query Parameters:**
- `studentId` (optional): Filter by student
- `status` (optional): Filter by status (pending, partial, paid)

#### POST `/api/student-fees`
Assign course to student.

**Request Body:**
```json
{
  "studentId": 1,
  "courseId": 1
}
```

### Payment Processing

#### POST `/api/payments/create-order`
Create Razorpay order for online payment.

**Request Body:**
```json
{
  "studentFeeId": 1,
  "amount": 50000
}
```

**Response:**
```json
{
  "orderId": "order_xyz123",
  "amount": 50000,
  "currency": "INR",
  "key": "rzp_key_id"
}
```

#### POST `/api/payments/verify`
Verify Razorpay payment signature.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash",
  "studentFeeId": 1
}
```

#### POST `/api/payments/record`
Record offline payment.

**Request Body:**
```json
{
  "studentFeeId": 1,
  "amount": 50000,
  "method": "cash",
  "transactionId": "TXN123",
  "notes": "Paid in full"
}
```

### Voice & Reminder System

#### POST `/api/reminders/send`
Send AI-powered voice reminder to individual student.

**Request Body:**
```json
{
  "studentFeeId": 1,
  "phoneNumber": "+1234567890",
  "language": "en",
  "customMessage": "Optional custom message"
}
```

#### POST `/api/reminders/send-script`
Send script-based TTS reminder (no AI conversation).

**Request Body:**
```json
{
  "studentFeeId": 1,
  "phoneNumber": "+1234567890",
  "scriptMessage": "Dear student, you have pending fees..."
}
```

#### POST `/api/reminders/send-bulk`
Send reminders to all students with pending fees.

**Request Body:**
```json
{
  "language": "en",
  "customTemplate": "Optional template",
  "type": "voice"
}
```

#### POST `/api/reminders/schedule`
Schedule reminder for future date.

**Request Body:**
```json
{
  "studentFeeId": 1,
  "scheduledAt": "2026-05-01T10:00:00Z",
  "language": "en",
  "type": "voice"
}
```

#### POST `/api/voice/incoming`
Twilio webhook for incoming call handling.

**Webhook URL:** `https://yourdomain.com/api/voice/incoming`

#### POST `/api/voice/gather`
Process speech input from Twilio.

#### POST `/api/voice/call-status`
Receive call status updates from Twilio.

#### GET `/api/voice/call-logs`
Retrieve call history.

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `status` (optional): Filter by call status

#### GET `/api/voice/conversation-logs`
Retrieve conversation transcripts.

**Query Parameters:**
- `callSid` (optional): Filter by call SID
- `studentId` (optional): Filter by student

## Database Schema

### Tables Overview

#### users
Admin user accounts with authentication credentials.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### students
Student records with contact information.

```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### courses
Course catalog with fee structures.

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  fee_amount DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### student_fees
Fee assignments linking students to courses.

```sql
CREATE TABLE student_fees (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  pending_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### payments
Payment transaction records.

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_fee_id INTEGER REFERENCES student_fees(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### reminders
Reminder logs and scheduled reminders.

```sql
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  student_fee_id INTEGER REFERENCES student_fees(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  message TEXT,
  twilio_call_sid VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### call_logs
Voice call tracking and metadata.

```sql
CREATE TABLE call_logs (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  student_fee_id INTEGER REFERENCES student_fees(id) ON DELETE SET NULL,
  call_sid VARCHAR(255) UNIQUE NOT NULL,
  from_number VARCHAR(20),
  to_number VARCHAR(20) NOT NULL,
  status VARCHAR(50),
  duration INTEGER,
  recording_url TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### conversation_logs
AI conversation transcripts and context.

```sql
CREATE TABLE conversation_logs (
  id SERIAL PRIMARY KEY,
  call_sid VARCHAR(255) REFERENCES call_logs(call_sid) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  intent VARCHAR(100),
  language VARCHAR(10),
  confidence DECIMAL(3, 2),
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships

- `student_fees` → `students` (many-to-one)
- `student_fees` → `courses` (many-to-one)
- `payments` → `student_fees` (many-to-one)
- `reminders` → `student_fees` (many-to-one)
- `call_logs` → `students` (many-to-one)
- `conversation_logs` → `call_logs` (many-to-one)

### Indexes

```sql
CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);
CREATE INDEX idx_payments_student_fee ON payments(student_fee_id);
CREATE INDEX idx_call_logs_student ON call_logs(student_id);
CREATE INDEX idx_conversation_logs_call ON conversation_logs(call_sid);
```

## Project Structure

```
student-fee-manager/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── modals/          # Modal dialogs
│   │   │   ├── AnimatedBackground.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── ModernLayout.tsx
│   │   │   ├── NotificationsPanel.tsx
│   │   │   ├── ParticleText.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── SkeletonLoader.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── use-toast.ts
│   │   ├── lib/                 # Utility functions
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/               # Page components
│   │   │   ├── Courses.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Payments.tsx
│   │   │   ├── Reminders.tsx
│   │   │   ├── Students.tsx
│   │   │   └── VoiceManagement.tsx
│   │   ├── styles/              # CSS files
│   │   │   ├── glassmorphism.css
│   │   │   └── index.css
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Entry point
│   └── index.html
├── server/                      # Backend Express application
│   ├── auth.ts                  # Authentication logic
│   ├── db.ts                    # Database connection
│   ├── groq.ts                  # Groq AI integration
│   ├── index.ts                 # Server entry point
│   ├── routes.ts                # API route handlers
│   ├── scheduler.ts             # Background job scheduler
│   ├── storage.ts               # Database operations
│   └── vite.ts                  # Vite middleware
├── shared/                      # Shared TypeScript types
│   └── schema.ts                # Database schema definitions
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── components.json              # Shadcn UI config
├── drizzle.config.ts            # Drizzle ORM config
├── package.json                 # Dependencies
├── postcss.config.js            # PostCSS config
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
└── vite.config.ts               # Vite config
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)

# Code Quality
npm run check            # TypeScript type checking
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5000`
   - Backend API: `http://localhost:5000/api`
   - Hot module replacement enabled

2. **Make Changes**
   - Edit files in `client/` for frontend
   - Edit files in `server/` for backend
   - Changes auto-reload in browser

3. **Database Changes**
   - Modify schema in `shared/schema.ts`
   - Run `npm run db:push` to apply changes
   - Use `npm run db:studio` to view data

4. **Testing**
   - Test API endpoints with Postman or curl
   - Test voice calls with Twilio console
   - Test payments with Razorpay test mode

### Code Style Guidelines

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic
- Use meaningful variable names
- Keep functions small and focused

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

## Security

### Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, randomly generated secrets
   - Rotate API keys and secrets regularly
   - Use different credentials for development and production

2. **Authentication**
   - Passwords hashed with bcrypt (10 rounds)
   - JWT tokens with expiration
   - Optional two-factor authentication (TOTP)
   - Session management with secure cookies

3. **Database Security**
   - Use parameterized queries (Drizzle ORM)
   - Enable SSL for database connections
   - Restrict database access by IP
   - Regular backups

4. **API Security**
   - Rate limiting on authentication endpoints
   - Input validation with Zod schemas
   - CORS configuration
   - Helmet.js for security headers

5. **Production Deployment**
   - Use HTTPS/TLS certificates
   - Enable firewall rules
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Implement logging and monitoring

### Sensitive Data Handling

**Never log or expose:**
- Passwords or password hashes
- API keys or secrets
- JWT tokens
- Payment card information
- Two-factor authentication secrets

**Secure storage:**
- Use environment variables for secrets
- Encrypt sensitive data at rest
- Use secure key management services
- Implement proper access controls

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** Cannot connect to PostgreSQL database

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check if database server is running
- Ensure SSL mode is configured: `?sslmode=require`
- Verify firewall allows connection
- Check database credentials

```bash
# Test database connection
psql $DATABASE_URL
```

#### Twilio Call Failures

**Problem:** Voice calls not connecting or failing

**Solutions:**
- Verify Twilio credentials in `.env`
- Check phone number format (include country code: +1234567890)
- Ensure `PUBLIC_URL` is set and accessible
- Verify webhook URL is publicly accessible (not localhost)
- Check Twilio console for error logs
- Verify account has sufficient balance

**Debug webhook:**
```bash
# Test webhook locally with ngrok
ngrok http 5000
# Update PUBLIC_URL to ngrok URL
```

#### Payment Processing Issues

**Problem:** Razorpay payments failing or not verifying

**Solutions:**
- Verify Razorpay key ID and secret
- Ensure test/live mode matches your keys
- Check webhook signature verification
- Review Razorpay dashboard for transaction logs
- Verify amount is in smallest currency unit (paise for INR)

#### AI Response Errors

**Problem:** Groq API errors or slow responses

**Solutions:**
- Verify `GROQ_API_KEY` is valid
- Check API quota and rate limits
- Review conversation logs for errors
- Ensure proper error handling in code
- Check network connectivity to Groq API

```bash
# Test Groq API
node test-groq.js
```

#### Build Failures

**Problem:** `npm run build` fails

**Solutions:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (requires 18+)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run check`
- Review build logs for specific errors

#### Port Already in Use

**Problem:** Cannot start server, port 5000 in use

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3000 npm run dev
```

### Debugging Tips

1. **Enable Verbose Logging**
   ```typescript
   // Add to server/index.ts
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.path}`);
     next();
   });
   ```

2. **Check Application Logs**
   ```bash
   # Development
   npm run dev

   # Production (with PM2)
   pm2 logs student-fee-manager
   ```

3. **Database Queries**
   ```bash
   # Open Drizzle Studio
   npm run db:studio
   ```

4. **Network Issues**
   ```bash
   # Test API endpoint
   curl -X GET http://localhost:5000/api/students

   # Test with authentication
   curl -X GET http://localhost:5000/api/students \
     -H "Authorization: Bearer <token>"
   ```

## Performance Optimization

### Frontend

- Code splitting with React.lazy()
- Image optimization
- Minimize bundle size
- Use production build
- Enable compression (gzip/brotli)
- Implement caching strategies

### Backend

- Database query optimization
- Connection pooling
- Caching with Redis (optional)
- Rate limiting
- Load balancing (for scale)
- CDN for static assets

### Database

- Add indexes on frequently queried columns
- Optimize complex queries
- Regular VACUUM and ANALYZE
- Monitor slow queries
- Use read replicas for scale

## Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/student-fee-manager.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Commit Changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Code Review Process

- All submissions require review
- Maintain code quality standards
- Ensure tests pass
- Update documentation as needed

### Reporting Issues

When reporting bugs, include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs

## License

MIT License

Copyright (c) 2026 Student Fee Manager

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

This project was built using excellent open-source tools and services:

- **Groq** - Fast LLM inference for conversational AI
- **Twilio** - Voice communication platform
- **Razorpay** - Payment gateway for India
- **Neon** - Serverless PostgreSQL hosting
- **React** - UI library
- **Express** - Web framework
- **Drizzle ORM** - Type-safe database toolkit
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

## Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/student-fee-manager/issues)
- **Documentation**: Review this README and inline code comments
- **API Logs**: Check server logs for detailed error information
- **Community**: Join discussions in GitHub Discussions

## Roadmap

Future enhancements planned:

- SMS reminder support
- Email notifications
- Multi-language support (Hindi, Spanish, etc.)
- Advanced analytics and reporting
- Mobile application (React Native)
- Batch payment processing
- Integration with accounting software
- Student portal for self-service
- Parent/guardian accounts
- Attendance tracking integration

## Changelog

### Version 2.0.0 (Current)
- Migrated from Google Gemini to Groq for AI processing
- Added script-based TTS reminders
- Improved conversation handling
- Enhanced UI with glassmorphism effects
- Added particle text animations
- Implemented command palette
- Better error handling and logging

### Version 1.0.0
- Initial release
- Student and course management
- Payment processing with Razorpay
- AI voice reminders with Twilio
- Dashboard analytics
- Two-factor authentication

---

**Built with care for educational institutions**

For more information, visit the [GitHub repository](https://github.com/yourusername/student-fee-manager).
