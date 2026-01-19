# Student Fee Manager

A comprehensive student fee management system with AI-powered voice reminders, automated payment processing, and intelligent conversation handling.

## Overview

This application helps educational institutions manage student fees, process payments, and send automated voice reminders. It features an AI assistant powered by Google Gemini that can handle voice calls in both English and Tamil, answer student queries, and provide personalized fee information.

## Key Features

- **Student & Course Management** - Track students, courses, and fee assignments
- **Payment Processing** - Integrated with Razorpay for online payments, supports cash and bank transfers
- **AI Voice Reminders** - Automated voice calls using Twilio with natural language processing
- **Bilingual Support** - Conversations in English and Tamil
- **Smart Conversations** - AI-powered intent classification and context-aware responses
- **Secure Authentication** - JWT tokens with optional 2FA (TOTP)
- **Dashboard Analytics** - Real-time statistics and payment tracking
- **Call Logs** - Complete history of voice interactions and conversations

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- TanStack Query for data fetching
- React Hook Form with Zod validation

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Drizzle ORM
- Neon Database (serverless PostgreSQL)
- JWT authentication with bcrypt
- TOTP 2FA with Speakeasy

### External Services
- **Google Gemini AI** - Natural language processing and conversation handling
- **Twilio** - Voice calls and speech recognition
- **Razorpay** - Payment gateway
- **Neon** - Serverless PostgreSQL hosting

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (or Neon account)
- Twilio account for voice calls
- Razorpay account for payments
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dharaneesh-2005/callrem.git
cd callrem
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PGDATABASE=your_database
PGHOST=your_host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password

# Authentication
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
ADMIN_REGISTRATION_KEY=your_admin_key

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Twilio (Voice Calls)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### First Time Setup

1. Navigate to the application URL
2. Register the first admin account (no admin key required for first user)
3. Optionally set up 2FA for additional security
4. Log in with your credentials

### Managing Students and Courses

1. Add courses with fee amounts and duration
2. Register students with contact information
3. Assign courses to students to create fee records
4. Track payment status (pending, partial, paid)

### Processing Payments

**Online Payments:**
- Students can pay via Razorpay integration
- Automatic receipt generation
- Real-time status updates

**Offline Payments:**
- Record cash, cheque, or bank transfer payments
- Manual receipt generation
- Add payment notes

### Sending Voice Reminders

**Individual Reminders:**
1. Go to Student Fees section
2. Select a student with pending fees
3. Click "Send Reminder"
4. Choose language (English or Tamil)
5. Optionally customize the message
6. The system will initiate an AI-powered voice call

**Bulk Reminders:**
1. Go to Reminders section
2. Click "Send Bulk Reminders"
3. Choose language and customize template
4. System sends reminders to all students with pending fees

**Scheduled Reminders:**
1. Set a future date and time
2. Choose message template
3. System automatically sends reminders at scheduled time

### AI Voice Conversations

The AI assistant can handle:
- Fee inquiries with personalized information
- Payment status questions
- Course information requests
- General support queries
- Transfer to human agents when needed

Conversations are logged and can be reviewed in the Voice Management section.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/setup-2fa` - Setup two-factor authentication
- `GET /api/auth/user` - Get current user

### Students & Courses
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create course

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/record` - Record offline payment

### Voice & Reminders
- `POST /api/reminders/send` - Send individual reminder
- `POST /api/reminders/send-bulk` - Send bulk reminders
- `POST /api/reminders/schedule` - Schedule reminders
- `POST /api/voice/webhook` - Twilio voice webhook
- `GET /api/voice/call-logs` - Get call history
- `GET /api/voice/conversation-logs` - Get conversation history

## Database Schema

**Main Tables:**
- `users` - Admin accounts
- `students` - Student records
- `courses` - Course catalog
- `student_fees` - Fee assignments
- `payments` - Payment records
- `reminders` - Reminder logs
- `call_logs` - Voice call tracking
- `conversation_logs` - AI conversation history

## Deployment

### Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy with these settings:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

### Other Platforms

The application can be deployed to any Node.js hosting platform. Ensure:
- Environment variables are properly configured
- Database is accessible
- Port binding is set to `0.0.0.0`

## Security Considerations

**IMPORTANT:** Never commit the `.env` file to version control. It contains sensitive credentials.

Before deploying:
1. Add `.env` to `.gitignore`
2. Use strong, unique passwords
3. Rotate API keys regularly
4. Enable 2FA for admin accounts
5. Use HTTPS in production
6. Keep dependencies updated

## Development

### Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication
│   ├── db.ts            # Database connection
│   ├── gemini.ts        # AI integration
│   └── scheduler.ts     # Background jobs
├── shared/              # Shared types
│   └── schema.ts        # Database schema
└── package.json
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database schema

## Troubleshooting

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Check if database is accessible
- Ensure SSL mode is configured properly

**Twilio Call Failures:**
- Verify Twilio credentials
- Check phone number format (include country code)
- Ensure webhook URLs are publicly accessible
- Review Twilio console for error logs

**Payment Processing Issues:**
- Verify Razorpay credentials
- Check if test/live mode matches your keys
- Review Razorpay dashboard for transaction logs

**AI Response Issues:**
- Verify Gemini API key is valid
- Check API quota limits
- Review conversation logs for errors

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your educational institution.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API logs for error details

## Acknowledgments

- Google Gemini for AI capabilities
- Twilio for voice communication
- Razorpay for payment processing
- Neon for database hosting
- The open-source community for excellent tools and libraries
