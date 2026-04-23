import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { z } from "zod";
import {
  insertCourseSchema,
  insertStudentSchema,
  insertStudentFeeSchema,
  insertPaymentSchema,
  insertReminderSchema,
} from "@shared/schema";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  hashPassword,
  verifyPassword,
  generateJWT,
  authenticateToken,
  type AuthRequest,
} from "./auth";
import Razorpay from "razorpay";
import twilio from "twilio";
import crypto from "crypto";
import { setTwilioClient } from "./scheduler";
import {
  generateChatResponse,
  detectLanguage,
  classifyIntentAndRespond,
  generateFollowupResponse,
  transcribeAudio,
  generateSpeech,
  type ChatContext,
  type IntentClassification
} from "./groq";
import { unlinkSync } from "fs";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Initialize Razorpay (conditionally)
let razorpay: any = null;

// Get credentials from environment variables only
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

console.log("Razorpay initialization attempt:", {
  key_id: razorpayKeyId ? `${razorpayKeyId.substring(0, 8)}...` : "missing",
  key_secret: razorpayKeySecret ? `${razorpayKeySecret.substring(0, 8)}...` : "missing"
});

if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpay = new Razorpay({
      key_id: razorpayKeyId.trim(),
      key_secret: razorpayKeySecret.trim(),
    });
    console.log("Razorpay initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Razorpay:", error);
  }
} else {
  console.log("Razorpay credentials not available");
}

// Initialize Twilio for voice calls
let twilioClient: any = null;

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

console.log("Twilio environment check:", {
  accountSid: TWILIO_ACCOUNT_SID ? TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'missing',
  authToken: TWILIO_AUTH_TOKEN ? TWILIO_AUTH_TOKEN.substring(0, 10) + '...' : 'missing',
  phoneNumber: TWILIO_PHONE_NUMBER || 'missing'
});

// Initialize Twilio
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("Twilio initialized successfully");
    
    // Share Twilio client with scheduler
    setTwilioClient(twilioClient, TWILIO_PHONE_NUMBER);
  } catch (error) {
    console.error("Failed to initialize Twilio:", error);
  }
} else {
  console.log("Twilio credentials incomplete - missing:", {
    accountSid: !TWILIO_ACCOUNT_SID,
    authToken: !TWILIO_AUTH_TOKEN,
    phoneNumber: !TWILIO_PHONE_NUMBER
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, totpCode } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA only if configured for the user
      if (user.totpSecret) {
        if (!totpCode) {
          return res.status(401).json({ message: "2FA code required" });
        }
        
        console.log("Verifying TOTP:", { totpCode, secret: user.totpSecret?.substring(0, 10) + "..." });
        const isTOTPValid = verifyTOTP(totpCode, user.totpSecret);
        console.log("TOTP verification result:", isTOTPValid);
        
        if (!isTOTPValid) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      const token = generateJWT({ id: user.id, username: user.username });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/registration-status", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json({
        registrationOpen: allUsers.length === 0,
        isFirstUser: allUsers.length === 0,
        totalUsers: allUsers.length
      });
    } catch (error) {
      console.error("Registration status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, adminKey } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if any users exist
      const allUsers = await storage.getAllUsers();
      
      // If this is not the first user, require admin key
      if (allUsers.length > 0) {
        const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || "admin-setup-key-2024";
        if (!adminKey || adminKey !== ADMIN_REGISTRATION_KEY) {
          return res.status(403).json({ message: "Admin registration is disabled. Contact system administrator." });
        }
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        isActive: true,
        isFirstUser: allUsers.length === 0,
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { secret, qrCodeUrl } = generateTOTPSecret(username);
      if (!qrCodeUrl) {
        return res.status(500).json({ message: "Failed to generate QR code URL" });
      }
      const qrCodeDataUrl = await generateQRCode(qrCodeUrl);

      // Store the secret temporarily (you might want to use a different approach)
      await storage.updateUser(user.id, { totpSecret: secret });

      res.json({
        secret,
        qrCodeDataUrl,
        manualEntryKey: secret,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post("/api/auth/verify-2fa", async (req, res) => {
    try {
      const { username, totpCode } = req.body;

      if (!username || !totpCode) {
        return res.status(400).json({ message: "Username and TOTP code required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.totpSecret) {
        return res.status(404).json({ message: "User not found or 2FA not configured" });
      }

      const isValid = verifyTOTP(totpCode, user.totpSecret);

      res.json({ valid: isValid });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.get("/api/auth/user", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Dashboard Routes
  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Course Routes
  app.get("/api/courses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Failed to get courses" });
    }
  });

  app.post("/api/courses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Create course error:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, updates);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      console.error("Update course error:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourse(id);
      
      if (!success) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Student Routes
  app.get("/api/students", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to get students" });
    }
  });

  app.post("/api/students", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      console.error("Create student error:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, updates);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      console.error("Update student error:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Student Fee Routes
  app.get("/api/student-fees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const studentFees = await storage.getStudentFees();
      res.json(studentFees);
    } catch (error) {
      console.error("Get student fees error:", error);
      res.status(500).json({ message: "Failed to get student fees" });
    }
  });

  app.post("/api/student-fees", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const studentFeeData = insertStudentFeeSchema.parse(req.body);
      const studentFee = await storage.createStudentFee(studentFeeData);
      res.status(201).json(studentFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student fee data", errors: error.errors });
      }
      console.error("Create student fee error:", error);
      res.status(500).json({ message: "Failed to create student fee assignment" });
    }
  });

  app.get("/api/student-fees/pending", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const pendingFees = await storage.getPendingStudentFees();
      res.json(pendingFees);
    } catch (error) {
      console.error("Get pending fees error:", error);
      res.status(500).json({ message: "Failed to get pending fees" });
    }
  });

  // Payment Routes
  app.get("/api/payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  app.post("/api/payments/create-order", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { amount, studentFeeId } = req.body;

      if (!amount || !studentFeeId) {
        return res.status(400).json({ message: "Amount and student fee ID required" });
      }

      if (!razorpay) {
        return res.status(503).json({ message: "Payment service not configured. Please check Razorpay credentials." });
      }

      const order = await razorpay.orders.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          studentFeeId: studentFeeId.toString(),
        },
      });

      res.json(order);
    } catch (error) {
      console.error("Create payment order error:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  app.post("/api/payments/verify", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, studentFeeId, amount } = req.body;

      console.log("Payment verification request:", {
        razorpay_payment_id,
        razorpay_order_id,
        studentFeeId,
        amount
      });

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment verification data" });
      }

      // Verify payment signature
      if (!razorpayKeySecret) {
        return res.status(500).json({ message: "Payment verification not configured" });
      }
      
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      console.log("Signature verification:", {
        expected: expectedSignature,
        received: razorpay_signature,
        match: expectedSignature === razorpay_signature
      });

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Generate receipt number
      const receiptNumber = `RCP_${Date.now()}`;

      // Create payment record
      const paymentData = {
        studentFeeId: parseInt(studentFeeId),
        amount: amount.toString(),
        paymentMethod: "razorpay",
        transactionId: razorpay_payment_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: "success",
        receiptNumber,
      };

      const payment = await storage.createPayment(paymentData);

      // Update student fee
      const studentFee = await storage.getStudentFee(parseInt(studentFeeId));
      if (studentFee) {
        const newPaidAmount = parseFloat(studentFee.paidAmount) + parseFloat(amount);
        const newPendingAmount = parseFloat(studentFee.totalFee) - newPaidAmount;
        const newStatus = newPendingAmount <= 0 ? "paid" : "partial";

        await storage.updateStudentFee(parseInt(studentFeeId), {
          paidAmount: newPaidAmount.toString(),
          pendingAmount: Math.max(0, newPendingAmount).toString(),
          status: newStatus,
        });
      }

      res.json({ message: "Payment verified successfully", payment });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.post("/api/payments/record", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { studentFeeId, amount, paymentMethod, notes } = req.body;

      if (!studentFeeId || !amount || !paymentMethod) {
        return res.status(400).json({ message: "Student fee ID, amount, and payment method required" });
      }

      // Generate receipt number
      const receiptNumber = `RCP_${Date.now()}`;

      // Create payment record
      const paymentData = {
        studentFeeId: parseInt(studentFeeId),
        amount: amount.toString(),
        paymentMethod,
        transactionId: `TXN_${Date.now()}`,
        status: "success",
        notes: notes || "",
        receiptNumber,
      };

      const payment = await storage.createPayment(paymentData);

      // Update student fee
      const studentFee = await storage.getStudentFee(parseInt(studentFeeId));
      if (studentFee) {
        const newPaidAmount = parseFloat(studentFee.paidAmount) + parseFloat(amount);
        const newPendingAmount = parseFloat(studentFee.totalFee) - newPaidAmount;
        const newStatus = newPendingAmount <= 0 ? "paid" : "partial";

        await storage.updateStudentFee(parseInt(studentFeeId), {
          paidAmount: newPaidAmount.toString(),
          pendingAmount: Math.max(0, newPendingAmount).toString(),
          status: newStatus,
        });
      }

      res.json({ message: "Payment recorded successfully", payment });
    } catch (error) {
      console.error("Record payment error:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Reminder Routes
  app.get("/api/reminders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Get reminders error:", error);
      res.status(500).json({ message: "Failed to get reminders" });
    }
  });

  app.post("/api/reminders/send", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { studentFeeId, phoneNumber, studentName, courseName, pendingAmount, customMessage, language = 'en' } = req.body;

      if (!studentFeeId || !phoneNumber || !studentName || !courseName || !pendingAmount) {
        return res.status(400).json({ message: "All fields required for reminder" });
      }

      if (!twilioClient) {
        return res.status(503).json({ message: "Voice reminder service not configured. Please check Twilio credentials." });
      }

      if (!TWILIO_PHONE_NUMBER) {
        return res.status(503).json({ message: "Twilio phone number not configured." });
      }

      // Validate phone number format
      if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
        return res.status(400).json({ message: "Invalid phone number format. Must be 10-15 digits." });
      }

      try {
        // Format phone number with country code if needed
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
        
        console.log("Initiating AI voice call with webhook:", {
          to: formattedPhone,
          from: TWILIO_PHONE_NUMBER,
          studentName,
          courseName,
          pendingAmount,
          language,
          studentFeeId
        });

        // Get current domain for webhook URLs
        const baseUrl = process.env.PUBLIC_URL || 
          (process.env.REPLIT_DOMAINS ? 
            `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
            req.get('host')?.includes('localhost') ? 
              `http://${req.get('host')}` : 
              `https://${req.get('host')}`);
        
        console.log("Using webhook base URL:", baseUrl);

        // Use Twilio for voice calls with AI webhook
        if (!twilioClient) {
          throw new Error('Twilio client not available');
        }

        const call = await twilioClient.calls.create({
          to: formattedPhone,
          from: TWILIO_PHONE_NUMBER,
          url: `${baseUrl}/api/voice/webhook?lang=${language}&studentId=${studentFeeId}`,
          statusCallback: `${baseUrl}/api/voice/call-status`,
          statusCallbackMethod: 'POST',
          timeout: 30,
          record: false
        });

        console.log("Twilio call created successfully:", {
          callSid: call.sid,
          status: call.status,
          to: call.to
        });

        // Create reminder record for AI voice call
        const reminderData = {
          studentFeeId: parseInt(studentFeeId),
          type: "voice" as const,
          status: "sent" as const,
          twilioCallSid: call.sid,
          message: `AI voice call initiated for ${studentName} - ${courseName} (Pending: ${pendingAmount})`,
          sentAt: new Date(),
        };

        console.log("Creating reminder record:", reminderData);
        
        try {
          const reminder = await storage.createReminder(reminderData);
          console.log("Reminder created successfully:", reminder);
          
          // Return success response with call details
          res.status(200).json({ 
            success: true,
            message: "Voice reminder sent successfully", 
            reminder,
            callDetails: {
              sid: call.sid,
              status: call.status,
              to: call.to,
              from: call.from
            }
          });
        } catch (dbError: any) {
          console.error("Database error creating reminder:", dbError);
          res.status(500).json({ 
            success: false,
            message: "Call initiated but failed to save reminder record",
            callSid: call.sid 
          });
        }
      } catch (twilioError: any) {
        console.error("Twilio error details:", {
          message: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status
        });
        
        // Create failed reminder record
        const reminderData = {
          studentFeeId: parseInt(studentFeeId),
          type: "voice" as const,
          status: "failed" as const,
          message: customMessage || "Payment reminder call failed",
          sentAt: new Date(),
        };

        try {
          await storage.createReminder(reminderData);
          res.status(500).json({ message: "Failed to send reminder via Twilio" });
        } catch (dbError: any) {
          console.error("Database error creating failed reminder:", dbError);
          res.status(500).json({ message: "Failed to send reminder and save record" });
        }
      }
    } catch (error) {
      console.error("Send reminder error:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.post("/api/reminders/schedule", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { scheduledAt, customTemplate, type = "voice", language = 'en' } = req.body;

      if (!scheduledAt) {
        return res.status(400).json({ message: "Scheduled date and time required" });
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({ message: "Scheduled time must be in the future" });
      }

      const pendingFees = await storage.getPendingStudentFees();
      if (pendingFees.length === 0) {
        return res.status(400).json({ message: "No pending fees found to schedule reminders for" });
      }

      const results = [];
      for (const fee of pendingFees) {
        try {
          let message;
          if (customTemplate) {
            message = customTemplate
              .replace(/{{studentName}}/g, `${fee.student.firstName} ${fee.student.lastName}`)
              .replace(/{{pendingAmount}}/g, fee.pendingAmount)
              .replace(/{{courseName}}/g, fee.course.name);
          } else {
            if (language === 'ta') {
              message = `வணக்கம் ${fee.student.firstName} ${fee.student.lastName}, உங்களுக்கு ${fee.course.name} பாடத்திற்காக ${fee.pendingAmount} ரூபாய் கட்டணம் நிலுவையில் உள்ளது என்பதை நினைவூட்டுகிறோம். தயவு செய்து விரைவில் கட்டணம் செலுத்துங்கள். நன்றி.`;
            } else {
              message = `Hello ${fee.student.firstName} ${fee.student.lastName}, this is a reminder that you have a pending fee of ${fee.pendingAmount} rupees for ${fee.course.name}. Please make the payment at your earliest convenience. Thank you.`;
            }
          }

          const reminderData = {
            studentFeeId: fee.id,
            type: type as "voice" | "sms",
            status: "scheduled" as const,
            message,
            scheduledAt: scheduledDate,
            sentAt: null,
          };

          const reminder = await storage.createReminder(reminderData);
          results.push({ studentFeeId: fee.id, status: "scheduled", reminderId: reminder.id });
        } catch (error) {
          console.error(`Error scheduling reminder for student ${fee.student.id}:`, error);
          results.push({ studentFeeId: fee.id, status: "failed" });
        }
      }

      res.json({ 
        message: "Reminders scheduled successfully", 
        scheduledAt: scheduledDate.toISOString(),
        results 
      });
    } catch (error) {
      console.error("Schedule reminders error:", error);
      res.status(500).json({ message: "Failed to schedule reminders" });
    }
  });

  // Main voice webhook endpoint - Groq-powered (STT + AI + TTS)
  app.post("/api/voice/webhook", async (req, res) => {
    try {
      const callSid = req.body.CallSid || '';
      const callerNumber = req.body.From || '';
      const toNumber = req.body.To || '';
      
      console.log("Voice webhook - Initial call (Groq-powered):", { callSid, callerNumber, toNumber });
      
      // Create call log
      try {
        await storage.createCallLog({
          callSid,
          toNumber,
          fromNumber: callerNumber,
          status: 'initiated'
        });
      } catch (error) {
        console.error("Failed to create call log:", error);
      }
      
      // Try to identify student by phone number
      let studentInfo = null;
      let language: 'en' | 'ta' = 'en';
      
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      if (urlParams.get('lang') === 'ta') {
        language = 'ta';
      }
      
      try {
        const students = await storage.getStudents();
        studentInfo = students.find(student => 
          student.phone && (
            student.phone === toNumber ||
            toNumber.endsWith(student.phone.replace(/^\+91/, '')) ||
            student.phone === toNumber.replace(/^\+91/, '') ||
            toNumber.replace(/^\+1/, '').endsWith(student.phone) ||
            student.phone.replace(/^\+91/, '') === toNumber.replace(/^\+1/, '') ||
            student.phone.replace(/[^\d]/g, '').endsWith(toNumber.replace(/[^\d]/g, '').slice(-10))
          )
        );
        
        console.log("Student lookup:", { 
          toNumber, 
          foundStudent: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'None',
          totalStudents: students.length 
        });
      } catch (error) {
        console.log("Could not search students:", error);
      }
      
      // Get base URL for webhook callbacks
      const baseUrl = process.env.PUBLIC_URL || 
        (process.env.REPLIT_DOMAINS ? 
          `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
          req.get('host')?.includes('localhost') ? 
            `http://${req.get('host')}` : 
            `https://${req.get('host')}`);
      
      console.log("Using base URL for callbacks:", baseUrl);
      
      // Create personalized greeting
      let greeting;
      if (studentInfo) {
        let pendingAmount = '';
        let courseName = '';
        let department = '';
        
        try {
          const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
          if (studentFees.length > 0) {
            const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
            if (pendingFee) {
              pendingAmount = pendingFee.pendingAmount;
              courseName = pendingFee.course?.name || 'Unknown Course';
              department = pendingFee.course?.description || 'your department';
            }
          }
        } catch (error) {
          console.log("Could not get student fees for greeting:", error);
        }
        
        if (pendingAmount && parseFloat(pendingAmount) > 0) {
          greeting = language === 'ta' 
            ? `வணக்கம் ${studentInfo.firstName}! நான் உங்க கல்லூரியோட AI assistant. உங்களுக்கு ${pendingAmount} ரூபாய் fees pending-ல இருக்கு. ஏதாவது doubt-ஆ இருக்கா?`
            : `Hello ${studentInfo.firstName}! I'm your AI assistant. You have a pending fee of ${pendingAmount} rupees in ${department}. Do you have any questions?`;
        } else {
          greeting = language === 'ta' 
            ? `வணக்கம் ${studentInfo.firstName}! நான் உங்க கல்லூரியோட AI assistant. ஏதாவது help வேணுமா?`
            : `Hello ${studentInfo.firstName}! I'm your AI assistant. How can I help you today?`;
        }
      } else {
        greeting = language === 'ta' 
          ? 'வணக்கம்! நான் உங்க கல்லூரியோட AI assistant. என்ன தெரிஞ்சுக்கணும்?'
          : 'Hello! I am your AI assistant. What would you like to know?';
      }
      
      // Generate speech using Groq TTS
      try {
        const greetingAudio = await generateSpeech(greeting, language);
        const audioPath = join(tmpdir(), `greeting_${callSid}.wav`);
        writeFileSync(audioPath, greetingAudio);
        
        // Upload audio to a temporary URL (you'll need to serve this)
        // For now, use Twilio's <Say> as fallback
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${greeting}</Say>
  <Pause length="1"/>
  <Record action="${baseUrl}/api/voice/groq-process" method="POST" maxLength="30" timeout="3" finishOnKey="#" playBeep="false" transcribe="false" />
</Response>`;

        console.log("TwiML with Groq processing:", twiml);
        
        res.type('text/xml');
        res.send(twiml);
        
        // Clean up temp file
        setTimeout(() => {
          try {
            unlinkSync(audioPath);
          } catch (e) {}
        }, 5000);
        
      } catch (error) {
        console.error("Groq TTS error, falling back to Twilio Say:", error);
        
        // Fallback to Twilio's Say
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${greeting}</Say>
  <Pause length="1"/>
  <Record action="${baseUrl}/api/voice/groq-process" method="POST" maxLength="30" timeout="3" finishOnKey="#" playBeep="false" transcribe="false" />
</Response>`;

        res.type('text/xml');
        res.send(twiml);
      }
      
      // Log initial interaction
      try {
        await storage.createConversationLog({
          callSid,
          userSpeech: `[Call initiated from ${callerNumber}]`,
          botResponse: greeting,
          intent: "greeting",
          confidence: "1.0",
          language,
          studentId: studentInfo?.id
        });
      } catch (error) {
        console.error("Failed to log initial conversation:", error);
      }
      
    } catch (error) {
      console.error("Voice webhook error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Sorry, there was an error. Please try again later.</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Process recorded audio with Groq STT + AI + TTS
  app.post("/api/voice/groq-process", async (req, res) => {
    try {
      const recordingUrl = req.body.RecordingUrl;
      const callSid = req.body.CallSid || '';
      
      console.log("Processing recording with Groq:", { recordingUrl, callSid });
      
      if (!recordingUrl) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">I didn't hear anything. Please try again.</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
      
      // Download the recording
      const audioResponse = await fetch(recordingUrl + '.wav', {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
        }
      });
      
      if (!audioResponse.ok) {
        console.error("Failed to download recording:", audioResponse.status);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">I couldn't process your audio. Please try again.</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
      
      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      
      // Check if audio is too short (less than 1KB is likely silence)
      if (audioBuffer.length < 1000) {
        console.log("Recording too short, likely silence:", audioBuffer.length);
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">I didn't hear anything. Please speak after the tone.</Say>
  <Pause length="1"/>
  <Record action="${process.env.PUBLIC_URL}/api/voice/groq-process" method="POST" maxLength="30" timeout="3" finishOnKey="#" playBeep="true" transcribe="false" />
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
      
      // Transcribe with Groq Whisper
      const transcription = await transcribeAudio(audioBuffer, 'recording.wav');
      console.log("Groq transcription:", transcription);
      
      if (!transcription || transcription.length < 2) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">I didn't catch that. Thank you for calling.</Say>
  <Hangup/>
</Response>`;
        res.type('text/xml');
        return res.send(twiml);
      }
      
      // Build context
      let context: ChatContext = { language: 'en' };
      let studentInfo = null;
      
      try {
        const callLog = await storage.getCallLogByCallSid(callSid);
        if (callLog) {
          const students = await storage.getStudents();
          studentInfo = students.find(student => 
            student.phone && callLog.toNumber.includes(student.phone.replace(/^\+91/, '').slice(-10))
          );
          
          if (studentInfo) {
            context.studentName = `${studentInfo.firstName} ${studentInfo.lastName}`;
            context.phone = studentInfo.phone;
            
            const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
            if (studentFees.length > 0) {
              const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
              if (pendingFee) {
                context.courseName = pendingFee.course?.name;
                context.pendingAmount = pendingFee.pendingAmount;
              }
            }
          }
        }
      } catch (error) {
        console.log("Could not get student context:", error);
      }
      
      // Detect language
      context.language = await detectLanguage(transcription);
      
      // Get AI response
      const classification = await classifyIntentAndRespond(transcription, context, callSid);
      console.log("Groq AI response:", classification);
      
      // Escape XML special characters in response
      const escapeXml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };
      
      const safeResponse = escapeXml(classification.suggestedResponse);
      const baseUrl = process.env.PUBLIC_URL || `https://${req.get('host')}`;
      
      // Generate audio with Groq TTS
      try {
        const responseAudio = await generateSpeech(classification.suggestedResponse, context.language);
        const audioFilename = `response_${callSid}_${Date.now()}.wav`;
        const audioPath = join(tmpdir(), audioFilename);
        writeFileSync(audioPath, responseAudio);
        
        console.log(`Generated audio file: ${audioFilename} (${responseAudio.length} bytes)`);
        
        // Check if conversation should end
        if (classification.intent === 'goodbye' || !classification.requiresFollowup) {
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${baseUrl}/api/voice/audio/${audioFilename}</Play>
  <Say voice="Polly.Aditi">Thank you for calling. Have a great day!</Say>
  <Hangup/>
</Response>`;
          res.type('text/xml');
          
          // Clean up after 30 seconds
          setTimeout(() => {
            try { unlinkSync(audioPath); } catch (e) {}
          }, 30000);
          
          return res.send(twiml);
        }
        
        // Continue conversation
        const followupAudio = await generateSpeech("Is there anything else I can help you with?", context.language);
        const followupFilename = `followup_${callSid}_${Date.now()}.wav`;
        const followupPath = join(tmpdir(), followupFilename);
        writeFileSync(followupPath, followupAudio);
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${baseUrl}/api/voice/audio/${audioFilename}</Play>
  <Pause length="1"/>
  <Play>${baseUrl}/api/voice/audio/${followupFilename}</Play>
  <Pause length="1"/>
  <Record action="${baseUrl}/api/voice/groq-process" method="POST" maxLength="30" timeout="3" finishOnKey="#" playBeep="false" transcribe="false" />
</Response>`;
        
        console.log("Sending TwiML with Groq TTS audio:", twiml);
        
        res.type('text/xml');
        res.send(twiml);
        
        // Clean up after 30 seconds
        setTimeout(() => {
          try { 
            unlinkSync(audioPath);
            unlinkSync(followupPath);
          } catch (e) {}
        }, 30000);
        
      } catch (ttsError) {
        console.error("Groq TTS error, falling back to Twilio Say:", ttsError);
        
        // Fallback to Twilio Say if Groq TTS fails
        if (classification.intent === 'goodbye' || !classification.requiresFollowup) {
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${safeResponse}</Say>
  <Say voice="Polly.Aditi">Thank you for calling. Have a great day!</Say>
  <Hangup/>
</Response>`;
          res.type('text/xml');
          return res.send(twiml);
        }
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${safeResponse}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi">Is there anything else I can help you with?</Say>
  <Pause length="1"/>
  <Record action="${baseUrl}/api/voice/groq-process" method="POST" maxLength="30" timeout="3" finishOnKey="#" playBeep="false" transcribe="false" />
</Response>`;
        
        console.log("Sending TwiML response (fallback):", twiml);
        
        res.type('text/xml');
        res.send(twiml);
      }
      
      // Log conversation
      try {
        await storage.createConversationLog({
          callSid,
          userSpeech: transcription,
          botResponse: classification.suggestedResponse,
          intent: classification.intent,
          confidence: classification.confidence.toString(),
          language: context.language,
          studentId: studentInfo?.id
        });
      } catch (error) {
        console.error("Failed to log conversation:", error);
      }
      
    } catch (error) {
      console.error("Groq processing error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Sorry, I had trouble processing that. Thank you for calling.</Say>
  <Hangup/>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // OLD ENDPOINT - Keep for backward compatibility
  app.post("/api/voice/webhook-old", async (req, res) => {
    try {
      const callSid = req.body.CallSid || '';
      const callerNumber = req.body.From || '';
      const toNumber = req.body.To || '';
      
      console.log("Voice webhook - Initial call:", { callSid, callerNumber, toNumber });
      
      // Create call log
      try {
        await storage.createCallLog({
          callSid,
          toNumber,
          fromNumber: callerNumber,
          status: 'initiated'
        });
      } catch (error) {
        console.error("Failed to create call log:", error);
      }
      
      // Try to identify student by phone number and get language preference
      let studentInfo = null;
      let language: 'en' | 'ta' = 'en';
      
      // Check if this call was initiated with a specific language (URL parameter)
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      if (urlParams.get('lang') === 'ta') {
        language = 'ta';
      }
      
      try {
        const students = await storage.getStudents();
        studentInfo = students.find(student => 
          student.phone && (
            student.phone === toNumber ||
            toNumber.endsWith(student.phone.replace(/^\+91/, '')) ||
            student.phone === toNumber.replace(/^\+91/, '') ||
            toNumber.replace(/^\+1/, '').endsWith(student.phone) ||
            student.phone.replace(/^\+91/, '') === toNumber.replace(/^\+1/, '') ||
            student.phone.replace(/[^\d]/g, '').endsWith(toNumber.replace(/[^\d]/g, '').slice(-10))
          )
        );
        
        console.log("Student lookup:", { 
          toNumber, 
          foundStudent: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'None',
          totalStudents: students.length 
        });
      } catch (error) {
        console.log("Could not search students:", error);
      }
      
      const voice = language === 'ta' ? 'Google.ta-IN-Standard-A' : 'Polly.Aditi';
      const twimlLanguage = language === 'ta' ? 'ta-IN' : 'en-IN';
      
      // Get base URL for webhook callbacks
      const baseUrl = process.env.PUBLIC_URL || 
        (process.env.REPLIT_DOMAINS ? 
          `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
          req.get('host')?.includes('localhost') ? 
            `http://${req.get('host')}` : 
            `https://${req.get('host')}`);
      
      console.log("Using base URL for callbacks:", baseUrl);
      
      // Create personalized greeting with fee details
      let greeting;
      if (studentInfo) {
        // Get fee information for personalized greeting
        let pendingAmount = '';
        let courseName = '';
        let department = '';
        
        try {
          const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
          console.log("Fee lookup for greeting:", { 
            studentId: studentInfo.id,
            feesFound: studentFees.length,
            fees: studentFees 
          });
          
          if (studentFees.length > 0) {
            const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
            if (pendingFee) {
              pendingAmount = pendingFee.pendingAmount;
              courseName = pendingFee.course?.name || 'Unknown Course';
              department = pendingFee.course?.description || studentInfo.email?.split('@')[0] || 'Unknown Department';
              
              console.log("Pending fee found:", { pendingAmount, courseName, department });
            } else {
              console.log("No pending fees found for student");
            }
          } else {
            console.log("No student fees found");
          }
        } catch (error) {
          console.log("Could not get student fees for greeting:", error);
        }
        
        if (pendingAmount && parseFloat(pendingAmount) > 0) {
          greeting = language === 'ta' 
            ? `வணக்கம் ${studentInfo.firstName}! நான் உங்க கல்லூரியோட AI assistant. உங்களுக்கு ${department} department-ல ${pendingAmount} ரூபாய் fees pending-ல இருக்கு. கொஞ்சம் சீக்கிரம் கட்டிடுங்க. ஏதாவது doubt-ஆ இருக்கா?`
            : `Hello ${studentInfo.firstName}! I'm your educational institution's AI assistant. You have a pending fee of ${pendingAmount} rupees in the ${department} department. Please pay the fee at your earliest convenience. Do you have any questions about this?`;
        } else {
          greeting = language === 'ta' 
            ? `வணக்கம் ${studentInfo.firstName}! நான் உங்க கல்லூரியோட AI assistant. உங்க எல்லா fees-ம் clear பண்ணிட்டீங்க. ஏதாவது help வேணுமா?`
            : `Hello ${studentInfo.firstName}! I'm your educational institution's AI assistant. All your fees are up to date. Do you have any questions I can help you with?`;
        }
        
        console.log("Final greeting created:", { greeting: greeting.substring(0, 100) + "..." });
      } else {
        greeting = language === 'ta' 
          ? 'வணக்கம்! நான் உங்க கல்லூரியோட AI assistant. Fees, courses, general info எல்லாத்துக்கும் help பண்ணுவேன். என்ன தெரிஞ்சுக்கணும்?'
          : 'Hello! I am your educational institution\'s AI assistant. I can help with fees, courses, or general information. Please tell me your question.';
      }
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${baseUrl}/api/voice/handle-speech" method="POST" speechTimeout="auto" timeout="10" language="${twimlLanguage}" hints="fee, payment, course, help, support">
    <Say voice="${voice}" language="${twimlLanguage}">${greeting.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Say>
  </Gather>
  <Say voice="${voice}" language="${twimlLanguage}">${language === 'ta' ? 'நான் உங்கள் பதிலைக் கேட்கவில்லை. தயவுசெய்து மீண்டும் அழைக்கவும். நன்றி!' : 'I didn\'t hear your response. Please call back. Thank you!'}</Say>
</Response>`;

      console.log("TwiML response being sent:", twiml);
      
      res.type('text/xml');
      res.send(twiml);
      
      // Log initial interaction
      try {
        await storage.createConversationLog({
          callSid,
          userSpeech: `[Call initiated from ${callerNumber}]`,
          botResponse: "AI-powered greeting provided",
          intent: "greeting",
          confidence: "1.0",
          language,
          studentId: studentInfo?.id
        });
      } catch (error) {
        console.error("Failed to log initial conversation:", error);
      }
      
    } catch (error) {
      console.error("Voice webhook error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Sorry, there was an error. Please try again later.</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Handle speech input from voice calls
  app.post("/api/voice/handle-speech", async (req, res) => {
    try {
      const speechResult = req.body.SpeechResult || '';
      const twilioConfidence = parseFloat(req.body.Confidence || '0.0');
      const callSid = req.body.CallSid || '';
      
      console.log("Speech received:", { speechResult, twilioConfidence, callSid });
      
      // Check speech recognition confidence - only reject if very low AND speech is empty/unclear
      if (twilioConfidence < 0.1 && (!speechResult || speechResult.length < 3)) {
        const retryResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">I'm sorry, I didn't quite catch that. Could you please speak a bit louder and repeat what you need help with?</Say>
  <Redirect>/api/voice/retry</Redirect>
</Response>`;
        
        res.type('text/xml');
        res.send(retryResponse);
        
        // Log low confidence attempt
        try {
          await storage.createConversationLog({
            callSid,
            userSpeech: `[Low confidence: ${speechResult}]`,
            botResponse: "Requested clearer speech due to low confidence",
            intent: "unclear",
            confidence: twilioConfidence.toString(),
            language: 'en'
          });
        } catch (error) {
          console.error("Failed to log low confidence conversation:", error);
        }
        
        return;
      }

      // Build comprehensive student context
      let context: ChatContext = { language: 'en' };
      let studentInfo = null;
      
      // Try to find student information from call logs or by searching
      try {
        const callLog = await storage.getCallLogByCallSid(callSid);
        if (callLog) {
          const students = await storage.getStudents();
          studentInfo = students.find(student => 
            student.phone && (
              student.phone === callLog.toNumber ||
              callLog.toNumber.endsWith(student.phone.replace(/^\+91/, '')) ||
              student.phone === callLog.toNumber.replace(/^\+91/, '') ||
              callLog.toNumber.replace(/^\+1/, '').endsWith(student.phone) ||
              student.phone.replace(/^\+91/, '') === callLog.toNumber.replace(/^\+1/, '') ||
              student.phone.replace(/[^\d]/g, '').endsWith(callLog.toNumber.replace(/[^\d]/g, '').slice(-10))
            )
          );
          
          console.log("Student lookup in speech handler:", { 
            callSid,
            toNumber: callLog.toNumber,
            fromNumber: callLog.fromNumber,
            foundStudent: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'None',
            totalStudents: students.length 
          });
        }
      } catch (error) {
        console.log("Could not get call log or find student:", error);
      }
      
      // Detect language and build context
      context.language = await detectLanguage(speechResult);
      
      if (studentInfo) {
        context.studentName = `${studentInfo.firstName} ${studentInfo.lastName}`;
        context.department = studentInfo.email?.split('@')[0] || 'Unknown';
        context.phone = studentInfo.phone;
        context.email = studentInfo.email;
        context.address = studentInfo.address || undefined;
        context.studentId = studentInfo.studentId;
        
        // Get fee information
        try {
          const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
          if (studentFees.length > 0) {
            const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
            const totalFees = studentFees.reduce((sum, fee) => sum + parseFloat(fee.totalFee), 0);
            const totalPaid = studentFees.reduce((sum, fee) => sum + parseFloat(fee.paidAmount), 0);
            
            context.totalFees = totalFees.toString();
            context.paidAmount = totalPaid.toString();
            
            if (pendingFee) {
              context.courseName = pendingFee.course?.name;
              context.pendingAmount = pendingFee.pendingAmount;
            }
          }
        } catch (error) {
          console.log("Could not get student fees:", error);
        }
      }
      
      console.log("Built context:", { 
        hasStudent: !!studentInfo, 
        language: context.language,
        studentName: context.studentName 
      });
      
      // Use Groq to classify intent and generate response
      try {
        const classification = await classifyIntentAndRespond(speechResult, context, callSid);
        
        console.log("Groq classification result:", classification);
        
        const voice = context.language === 'ta' ? 'Google.ta-IN-Standard-A' : 'Polly.Aditi';
        const twimlLanguage = context.language === 'ta' ? 'ta-IN' : 'en-IN';
        
        // Get base URL for webhook callbacks
        const baseUrl = process.env.PUBLIC_URL || 
          (process.env.REPLIT_DOMAINS ? 
            `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
            req.get('host')?.includes('localhost') ? 
              `http://${req.get('host')}` : 
              `https://${req.get('host')}`);
        
        let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${twimlLanguage}">${classification.suggestedResponse.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Say>`;

        // Check if user wants to end the call
        if (classification.intent === 'goodbye' || !classification.requiresFollowup) {
          // End the call gracefully
          twiml += `<Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'நன்றி, அழைப்பிற்கு. நல்ல நாள்!' : 'Thank you for calling. Have a great day!'}</Say>
</Response>`;
        } else if (classification.shouldTransfer) {
          if (classification.department === 'support') {
            twiml += `<Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'தயவுசெய்து காத்திருக்கவும், எங்கள் ஆதரவு குழுவுடன் இணைக்கிறேன்.' : 'Please hold while I connect you to our support team.'}</Say>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'ஆதரவு பிரதிநிதி விரைவில் உங்களைத் தொடர்புகொள்வார். அழைப்பிற்கு நன்றி.' : 'A support representative will contact you shortly. Thank you for calling.'}</Say>`;
          } else if (classification.department === 'fees') {
            twiml += `<Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'கட்டணம் தொடர்பான உங்கள் கேள்விக்கு எங்கள் கட்டணம் குழுவுடன் இணைக்கிறேன்.' : 'Let me connect you with our fees department for your payment inquiry.'}</Say>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'கட்டணம் பிரதிநிதி விரைவில் உங்களுடன் இருப்பார். நன்றி!' : 'A fees representative will be with you shortly. Thank you!'}</Say>`;
          } else {
            twiml += `<Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'அழைப்பிற்கு நன்றி. நல்ல நாள்!' : 'Thank you for calling. Have a wonderful day!'}</Say>`;
          }
          twiml += `</Response>`;
        } else {
          // Continue conversation - ask if they have more questions
          twiml += `<Gather input="speech" action="${baseUrl}/api/voice/handle-followup" method="POST" speechTimeout="3" timeout="8" language="${twimlLanguage}">
    <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'வேற ஏதாவது doubt இருக்கா?' : 'Is there anything else I can help you with?'}</Say>
  </Gather>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'சரி, நன்றி call பண்ணினதுக்கு!' : 'Alright, thank you for calling. Have a great day!'}</Say>
</Response>`;
        }

        res.type('text/xml');
        res.send(twiml);
        
        // Log the conversation
        try {
          await storage.createConversationLog({
            callSid,
            userSpeech: speechResult,
            botResponse: classification.suggestedResponse,
            intent: classification.intent,
            confidence: classification.confidence.toString(),
            language: context.language,
            studentId: studentInfo?.id
          });
        } catch (error) {
          console.error("Failed to log conversation:", error);
        }
        
      } catch (error) {
        console.error("Error processing speech with Groq:", error);
        
        // Fallback response
        const fallbackResponse = context.language === 'ta' 
          ? "மன்னிக்கவும், தற்போது உங்கள் கோரிக்கையை செயலாக்க சிக்கல் உள்ளது. எங்கள் பிரதிநிதி உங்களுக்கு உதவ இணைக்கிறேன்."
          : "I'm having trouble processing your request right now. Let me connect you with a representative who can help you.";
          
        const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${fallbackResponse}</Say>
  <Say voice="alice" language="en-IN">${context.language === 'ta' ? 'தயவுசெய்து காத்திருக்கவும். உங்கள் பொறுமைக்கு நன்றி.' : 'Please hold while we connect you. Thank you for your patience.'}</Say>
</Response>`;
        
        res.type('text/xml');
        res.send(errorTwiml);
        
        // Log the error
        try {
          await storage.createConversationLog({
            callSid,
            userSpeech: speechResult,
            botResponse: fallbackResponse,
            intent: "error",
            confidence: "0.0",
            language: context.language,
            studentId: studentInfo?.id
          });
        } catch (dbError) {
          console.error("Failed to log error conversation:", dbError);
        }
      }
      
    } catch (error) {
      console.error("Handle speech error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Sorry, there was an error processing your request. Please try again later.</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Handle followup questions
  app.post("/api/voice/handle-followup", async (req, res) => {
    try {
      const speechResult = req.body.SpeechResult || '';
      const callSid = req.body.CallSid || '';
      
      console.log("Follow-up speech:", { speechResult, callSid });
      
      // Get previous conversation context
      const conversations = await storage.getConversationLogsByCallSid(callSid);
      const lastConversation = conversations[conversations.length - 1];
      const previousIntent = lastConversation?.intent || 'general';
      
      // Build context from previous conversations
      let context: ChatContext = { language: 'en' };
      let studentInfo = null;
      
      if (lastConversation?.studentId) {
        try {
          studentInfo = await storage.getStudent(lastConversation.studentId);
        } catch (error) {
          console.log("Could not get student from previous conversation:", error);
        }
      }
      
      // Detect language and build context
      context.language = await detectLanguage(speechResult);
      
      if (studentInfo) {
        context.studentName = `${studentInfo.firstName} ${studentInfo.lastName}`;
        context.department = studentInfo.email?.split('@')[0] || 'Unknown';
        context.phone = studentInfo.phone;
        context.email = studentInfo.email;
        context.address = studentInfo.address || undefined;
        context.studentId = studentInfo.studentId;
        
        // Get fee information
        try {
          const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
          if (studentFees.length > 0) {
            const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
            const totalFees = studentFees.reduce((sum, fee) => sum + parseFloat(fee.totalFee), 0);
            const totalPaid = studentFees.reduce((sum, fee) => sum + parseFloat(fee.paidAmount), 0);
            
            context.totalFees = totalFees.toString();
            context.paidAmount = totalPaid.toString();
            
            if (pendingFee) {
              context.courseName = pendingFee.course?.name;
              context.pendingAmount = pendingFee.pendingAmount;
            }
          }
        } catch (error) {
          console.log("Could not get student fees for followup:", error);
        }
      }
      
      try {
        // Check if user wants to end the call (simple detection)
        const goodbyePhrases = ['no', 'nope', 'nothing', 'that\'s all', 'thank you', 'thanks', 'bye', 'goodbye', 'okay', 'ok', 'alright', 'all set', 'i\'m good'];
        const speechLower = speechResult.toLowerCase().trim();
        const isGoodbye = goodbyePhrases.some(phrase => speechLower.includes(phrase)) && speechLower.length < 30;
        
        if (isGoodbye) {
          // User wants to end the call
          const voice = context.language === 'ta' ? 'Google.ta-IN-Standard-A' : 'Polly.Aditi';
          const twimlLanguage = context.language === 'ta' ? 'ta-IN' : 'en-IN';
          
          const goodbyeTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'நன்றி, அழைப்பிற்கு. நல்ல நாள்!' : 'Thank you for calling. Have a great day!'}</Say>
</Response>`;
          
          res.type('text/xml');
          res.send(goodbyeTwiml);
          
          // Log goodbye
          try {
            await storage.createConversationLog({
              callSid,
              userSpeech: speechResult,
              botResponse: "Call ended by user",
              intent: "goodbye",
              confidence: "1.0",
              language: context.language,
              studentId: studentInfo?.id
            });
          } catch (error) {
            console.error("Failed to log goodbye:", error);
          }
          
          return;
        }
        
        const followupResponse = await generateFollowupResponse(
          speechResult, 
          previousIntent, 
          context, 
          callSid
        );
        
        console.log("Generated followup response:", followupResponse);
        
        const voice = context.language === 'ta' ? 'Google.ta-IN-Standard-A' : 'Polly.Aditi';
        const twimlLanguage = context.language === 'ta' ? 'ta-IN' : 'en-IN';
        
        // Ask one more time if they have questions, then end
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${twimlLanguage}">${followupResponse.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Say>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'நன்றி, அழைப்பிற்கு. நல்ல நாள்!' : 'Thank you for calling. Have a great day!'}</Say>
</Response>`;

        res.type('text/xml');
        res.send(twiml);
        
        // Log the follow-up conversation
        try {
          await storage.createConversationLog({
            callSid,
            userSpeech: speechResult,
            botResponse: followupResponse,
            intent: "followup",
            confidence: "0.8",
            language: context.language,
            studentId: studentInfo?.id
          });
        } catch (error) {
          console.error("Failed to log followup conversation:", error);
        }
        
      } catch (error) {
        console.error("Error generating followup response:", error);
        
        const defaultResponse = context.language === 'ta' 
          ? "அந்த கேள்விக்கு நன்றி. மேலும் விரிவான தகவலுக்கு, எங்கள் வலைத்தளத்தைப் பார்வையிடவும் அல்லது எங்கள் பிரதிநிதிகளுடன் பேசவும்."
          : "Thank you for that question. For more detailed information, please visit our website or speak with one of our representatives.";
          
        const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${defaultResponse}</Say>
  <Say voice="alice" language="en-IN">${context.language === 'ta' ? 'நன்றி, அழைப்பிற்கு. நல்ல நாள்!' : 'Thank you for calling. Have a wonderful day!'}</Say>
</Response>`;
        
        res.type('text/xml');
        res.send(fallbackTwiml);
      }
      
    } catch (error) {
      console.error("Handle followup error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Thank you for calling. Have a great day!</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Retry endpoint for unclear speech
  app.post("/api/voice/retry", async (req, res) => {
    try {
      const callSid = req.body.CallSid || '';
      
      const retryTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/api/voice/handle-speech" method="POST" speechTimeout="5" timeout="12" language="en-IN">
    <Say voice="alice" language="en-IN">Let me try to help you better. You can say things like 'I need help with fees', 'I want course information', or 'I have a payment question'. What would you like help with?</Say>
  </Gather>
  <Say voice="alice" language="en-IN">Thank you for calling. If you need immediate assistance, please call back. Goodbye!</Say>
</Response>`;

      res.type('text/xml');
      res.send(retryTwiml);
      
      // Log retry attempt
      try {
        await storage.createConversationLog({
          callSid,
          userSpeech: "[Retry attempt]",
          botResponse: "Clarification provided for retry",
          intent: "retry",
          confidence: "0.5",
          language: 'en'
        });
      } catch (error) {
        console.error("Failed to log retry conversation:", error);
      }
      
    } catch (error) {
      console.error("Retry endpoint error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Thank you for calling. Goodbye!</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Serve audio files for Groq TTS
  app.get("/api/voice/audio/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Security: only allow .wav files and prevent directory traversal
      if (!filename.endsWith('.wav') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).send('Invalid filename');
      }
      
      const audioPath = join(tmpdir(), filename);
      
      // Check if file exists
      if (!existsSync(audioPath)) {
        console.log("Audio file not found:", audioPath);
        return res.status(404).send('Audio file not found');
      }
      
      console.log("Serving audio file:", filename);
      
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(audioPath);
      
    } catch (error) {
      console.error("Error serving audio file:", error);
      res.status(500).send('Error serving audio');
    }
  });

  // Call status webhook
  app.post("/api/voice/call-status", async (req, res) => {
    try {
      const callSid = req.body.CallSid || '';
      const callStatus = req.body.CallStatus || '';
      const callDuration = parseInt(req.body.CallDuration || '0');
      
      console.log("Call status update:", { callSid, callStatus, callDuration });
      
      // Update call log
      try {
        await storage.updateCallLog(callSid, {
          status: callStatus,
          duration: callDuration
        });
      } catch (error) {
        console.error("Failed to update call status:", error);
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      console.error("Call status webhook error:", error);
      res.status(500).send('Error');
    }
  });

  // Get call logs
  app.get("/api/voice/call-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const callLogs = await storage.getCallLogs();
      res.json(callLogs);
    } catch (error) {
      console.error("Error fetching call logs:", error);
      res.status(500).json({ message: "Failed to fetch call logs" });
    }
  });

  // Get conversation logs
  app.get("/api/voice/conversation-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationLogs = await storage.getConversationLogs();
      res.json(conversationLogs);
    } catch (error) {
      console.error("Error fetching conversation logs:", error);
      res.status(500).json({ message: "Failed to fetch conversation logs" });
    }
  });

  // Get conversation logs for a specific call
  app.get("/api/voice/conversation-logs/:callSid", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { callSid } = req.params;
      const conversationLogs = await storage.getConversationLogsByCallSid(callSid);
      res.json(conversationLogs);
    } catch (error) {
      console.error("Error fetching conversation logs for call:", error);
      res.status(500).json({ message: "Failed to fetch conversation logs" });
    }
  });

  // Test voice processing with Groq Llama AI
  app.post("/api/voice/test-groq", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { text, language = 'en', studentId } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required for testing" });
      }

      // Build test context
      let context: ChatContext = { language: language as 'en' | 'ta' };
      
      if (studentId) {
        try {
          const studentInfo = await storage.getStudent(studentId);
          if (studentInfo) {
            context.studentName = `${studentInfo.firstName} ${studentInfo.lastName}`;
            context.department = studentInfo.email?.split('@')[0] || 'Unknown';
            context.phone = studentInfo.phone;
            context.email = studentInfo.email;
            context.address = studentInfo.address || undefined;
            context.studentId = studentInfo.studentId;
            
            // Get fee information
            const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
            if (studentFees.length > 0) {
              const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
              const totalFees = studentFees.reduce((sum, fee) => sum + parseFloat(fee.totalFee), 0);
              const totalPaid = studentFees.reduce((sum, fee) => sum + parseFloat(fee.paidAmount), 0);
              
              context.totalFees = totalFees.toString();
              context.paidAmount = totalPaid.toString();
              
              if (pendingFee) {
                context.courseName = pendingFee.course?.name;
                context.pendingAmount = pendingFee.pendingAmount;
              }
            }
          }
        } catch (error) {
          console.log("Could not get student for test:", error);
        }
      }

      console.log("Testing Groq Llama with context:", { text, context });

      const startTime = Date.now();
      const classification = await classifyIntentAndRespond(text, context, 'test-call');
      const processingTime = Date.now() - startTime;
      
      res.json({
        success: true,
        input: text,
        context: context,
        aiProvider: "groq-llama",
        processingTimeMs: processingTime,
        result: {
          intent: classification.intent,
          confidence: classification.confidence,
          response: classification.suggestedResponse,
          shouldTransfer: classification.shouldTransfer,
          department: classification.department,
          requiresFollowup: classification.requiresFollowup
        }
      });
      
    } catch (error) {
      console.error("Error testing Groq Llama:", error);
      res.status(500).json({
        message: "Failed to test Groq Llama processing",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Interactive chatbot endpoint for handling voice input
  app.post("/api/chat/voice", async (req, res) => {
    try {
      const userInput = req.body.SpeechResult || req.body.userInput || '';
      const studentId = req.query.studentId as string || req.body.studentId;
      const language = req.query.language as string || req.body.language || 'en';
      const phoneNumber = req.query.phone as string || req.body.phone || '';
      
      console.log("Voice chat request:", { userInput, studentId, language, phoneNumber });
      
      // Build comprehensive student context
      let context: ChatContext = { 
        language: language as 'en' | 'ta',
        phone: phoneNumber
      };
      
      // Get student information
      let student = null;
      if (studentId && studentId !== '') {
        student = await storage.getStudent(parseInt(studentId));
      } else if (phoneNumber) {
        // Try to find student by phone if no studentId
        const students = await storage.getStudents();
        student = students.find(s => 
          s.phone && (
            s.phone === phoneNumber ||
            phoneNumber.endsWith(s.phone) ||
            s.phone === phoneNumber.replace(/^\+91/, '')
          )
        );
      }
      
      if (student) {
        context.studentName = `${student.firstName} ${student.lastName}`;
        context.department = student.email?.split('@')[0] || 'Unknown'; // Infer department from email
        
        // Get all fee information for this student
        const studentFees = await storage.getStudentFeesByStudent(student.id);
        
        if (studentFees.length > 0) {
          const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
          const totalFees = studentFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
          const totalPaid = studentFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) - parseFloat(fee.pendingAmount)), 0);
          
          context.totalFees = totalFees.toString();
          context.paidAmount = totalPaid.toString();
          
          if (pendingFee) {
            context.courseName = pendingFee.course?.name;
            context.pendingAmount = pendingFee.pendingAmount;
          }
        }
      }
      
      // Detect language if not provided and we have user input
      if (!language && userInput) {
        context.language = await detectLanguage(userInput);
      }
      
      // Generate AI response with full context
      const aiResponse = await generateChatResponse(userInput, context);
      
      console.log("Generated AI response:", { 
        input: userInput, 
        response: aiResponse, 
        language: context.language,
        studentFound: !!student 
      });
      
      // Return TwiML response with AI-generated content and continue conversation
      const voice = context.language === 'ta' ? 'Google.ta-IN-Standard-A' : 'alice';
      const twimlLanguage = context.language === 'ta' ? 'ta-IN' : 'en-IN';
      
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${twimlLanguage}">${aiResponse.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Say>
  <Gather input="speech" action="/api/chat/voice?studentId=${student?.id || ''}&language=${context.language}&phone=${encodeURIComponent(phoneNumber)}" method="POST" speechTimeout="5" timeout="15" language="${twimlLanguage}">
    <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'வேறு ஏதேனும் கேள்வி இருக்கிறதா?' : 'Do you have any other questions?'}</Say>
  </Gather>
  <Say voice="${voice}" language="${twimlLanguage}">${context.language === 'ta' ? 'நன்றி, உங்கள் அழைப்பிற்கு. நல்ல நாள்!' : 'Thank you for calling. Have a great day!'}</Say>
</Response>`;

      res.type('text/xml');
      res.send(twiml);
      
    } catch (error) {
      console.error("Voice chat error:", error);
      
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Sorry, there was an error processing your request. Please try again later.</Say>
</Response>`;
      
      res.type('text/xml');
      res.send(errorTwiml);
    }
  });

  // Initiate intelligent voice call with speech processing
  app.post("/api/voice/initiate-call", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, language = 'en', studentId } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      if (!twilioClient) {
        return res.status(503).json({ message: "Voice call service not configured. Please check Twilio credentials." });
      }
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      console.log("Initiating intelligent voice call:", { formattedPhone, language, studentId });
      
      // Get current domain for webhook URLs
      const baseUrl = process.env.PUBLIC_URL || 
        (process.env.REPLIT_DOMAINS ? 
          `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
          req.get('host')?.includes('localhost') ? 
            `http://${req.get('host')}` : 
            `https://${req.get('host')}`);
      
      console.log("Using webhook base URL:", baseUrl);
      
      // Create call using webhook URLs (for proper speech processing)
      const call = await twilioClient.calls.create({
        to: formattedPhone,
        from: TWILIO_PHONE_NUMBER,
        url: `${baseUrl}/api/voice/webhook?lang=${language}&studentId=${studentId || ''}`,
        statusCallback: `${baseUrl}/api/voice/call-status`,
        statusCallbackMethod: 'POST',
        timeout: 30,
        record: false
      });

      console.log("Intelligent voice call initiated:", { callSid: call.sid, status: call.status });
      
      res.json({ 
        success: true, 
        message: "Intelligent voice call initiated successfully",
        callSid: call.sid,
        callDetails: {
          sid: call.sid,
          status: call.status,
          to: call.to,
          from: call.from
        }
      });
      
    } catch (error) {
      console.error("Error initiating intelligent voice call:", error);
      res.status(500).json({ message: "Failed to initiate intelligent voice call" });
    }
  });

  // Initiate chatbot conversation (legacy endpoint)
  app.post("/api/chatbot/start", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, language = 'en', studentId } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      console.log("Starting chatbot conversation:", { formattedPhone, language, studentId });
      
      const voice = language === 'ta' ? 'Google.ta-IN-Standard-A' : 'alice';
      const twimlLanguage = language === 'ta' ? 'ta-IN' : 'en-IN';
      
      // Initial greeting TwiML
      const initialGreeting = language === 'ta' 
        ? 'வணக்கம்! நான் உங்கள் AI உதவியாளர். உங்கள் கேள்விகளைக் கேட்கலாம்.'
        : 'Hello! I am your AI assistant. You can ask me any questions.';
      
      // Try to identify student by phone number
      let studentContext = '';
      let studentInfo = null;
      
      try {
        // Search for student by phone number
        const students = await storage.getStudents();
        studentInfo = students.find(student => 
          student.phone && (
            student.phone === phoneNumber ||
            student.phone === formattedPhone ||
            student.phone === phoneNumber.replace(/^\+91/, '') ||
            formattedPhone.endsWith(student.phone)
          )
        );
        
        if (studentInfo) {
          const studentFees = await storage.getStudentFeesByStudent(studentInfo.id);
          const pendingFee = studentFees.find(fee => parseFloat(fee.pendingAmount) > 0);
          
          studentContext = language === 'ta' 
            ? `${studentInfo.firstName} ${studentInfo.lastName}, ${pendingFee ? `உங்களுக்கு ${pendingFee.course?.name} பாடத்திற்காக ₹${pendingFee.pendingAmount} நிலுவையில் உள்ளது` : 'உங்கள் கட்டணம் செலுத்தப்பட்டுள்ளது'}.`
            : `${studentInfo.firstName} ${studentInfo.lastName}, ${pendingFee ? `you have ₹${pendingFee.pendingAmount} pending for ${pendingFee.course?.name}` : 'your fees are up to date'}.`;
        }
      } catch (error) {
        console.log("Could not identify student by phone:", error);
      }
      
      // Create interactive TwiML that starts conversation
      const initialTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${twimlLanguage}">${initialGreeting} ${studentContext}</Say>
  <Gather input="speech" action="/api/chat/voice?studentId=${studentInfo?.id || ''}&language=${language}&phone=${encodeURIComponent(formattedPhone)}" method="POST" speechTimeout="3" timeout="10" language="${twimlLanguage}">
    <Say voice="${voice}" language="${twimlLanguage}">${language === 'ta' ? 'உங்கள் கேள்வியைக் கேட்கவும். கட்டணம், படிப்பு அல்லது பிற விஷயங்களைப் பற்றி கேட்கலாம்.' : 'Please ask your question. You can ask about fees, courses, or other matters.'}</Say>
  </Gather>
  <Say voice="${voice}" language="${twimlLanguage}">${language === 'ta' ? 'நன்றி, அழைப்பு முடிகிறது' : 'Thank you, call ending'}</Say>
</Response>`;

      console.log("Creating call with TwiML:", { twimlLength: initialTwiML.length });
      
      const call = await twilioClient.calls.create({
        to: formattedPhone,
        from: TWILIO_PHONE_NUMBER,
        twiml: initialTwiML
      });

      console.log("Chatbot call initiated:", { callSid: call.sid, status: call.status });
      
      res.json({ 
        success: true, 
        message: "Chatbot conversation started",
        callSid: call.sid 
      });
      
    } catch (error) {
      console.error("Error starting chatbot:", error);
      res.status(500).json({ message: "Failed to start chatbot conversation" });
    }
  });

  app.post("/api/reminders/send-bulk", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { customTemplate, language = 'en' } = req.body;
      const pendingFees = await storage.getPendingStudentFees();
      const results = [];

      for (const fee of pendingFees) {
        // Process custom template if provided, otherwise use default based on language
        let cleanMessage;
        if (customTemplate) {
          cleanMessage = customTemplate
            .replace(/{{studentName}}/g, `${fee.student.firstName} ${fee.student.lastName}`)
            .replace(/{{pendingAmount}}/g, fee.pendingAmount)
            .replace(/{{courseName}}/g, fee.course.name);
        } else {
          if (language === 'ta') {
            cleanMessage = `வணக்கம் ${fee.student.firstName} ${fee.student.lastName}, உங்களுக்கு ${fee.course.name} பாடத்திற்காக ${fee.pendingAmount} ரூபாய் கட்டணம் நிலுவையில் உள்ளது என்பதை நினைவூட்டுகிறோம். தயவு செய்து விரைவில் கட்டணம் செலுத்துங்கள். நன்றி.`;
          } else {
            cleanMessage = `Hello ${fee.student.firstName} ${fee.student.lastName}, this is a reminder that you have a pending fee of ${fee.pendingAmount} rupees for ${fee.course.name}. Please make the payment at your earliest convenience. Thank you.`;
          }
        }
        
        // Clean the message for TwiML (escape XML characters, preserve Tamil text)
        const messageToUse = cleanMessage
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .trim();

        // Determine TwiML language and voice based on selection
        const twimlLanguage = language === 'ta' ? 'ta-IN' : 'en-IN';
        const voiceName = language === 'ta' ? 'Google.ta-IN-Standard-A' : 'alice';
        
        // Format phone number with country code
        const formattedPhone = fee.student.phone.startsWith('+') ? fee.student.phone : `+91${fee.student.phone}`;

        try {
          // Create inline TwiML (works in all environments including localhost)
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceName}" language="${twimlLanguage}">${messageToUse}</Say>
</Response>`;

          const call = await twilioClient.calls.create({
            twiml: twiml,
            to: formattedPhone,
            from: TWILIO_PHONE_NUMBER,
            timeout: 30,
            record: false,
            machineDetection: 'Enable',
          });

          const reminderData = {
            studentFeeId: fee.id,
            type: "voice" as const,
            status: "sent" as const,
            twilioCallSid: call.sid,
            message: cleanMessage,
            sentAt: new Date(),
          };

          try {
            await storage.createReminder(reminderData);
            results.push({ studentFeeId: fee.id, status: "sent", callSid: call.sid });
          } catch (dbError: any) {
            console.error("Database error in bulk reminder:", dbError);
            results.push({ studentFeeId: fee.id, status: "sent_db_error", callSid: call.sid });
          }
        } catch (twilioError) {
          console.error(`Twilio error for student ${fee.student.id}:`, twilioError);
          
          const reminderData = {
            studentFeeId: fee.id,
            type: "voice" as const,
            status: "failed" as const,
            message: cleanMessage,
            sentAt: new Date(),
          };

          try {
            await storage.createReminder(reminderData);
            results.push({ studentFeeId: fee.id, status: "failed" });
          } catch (dbError: any) {
            console.error("Database error creating failed bulk reminder:", dbError);
            results.push({ studentFeeId: fee.id, status: "failed_db_error" });
          }
        }

        // Add delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      res.json({ message: "Bulk reminders processed", results });
    } catch (error) {
      console.error("Send bulk reminders error:", error);
      res.status(500).json({ message: "Failed to send bulk reminders" });
    }
  });





  // TwiML endpoint for voice reminders - must be publicly accessible
  app.get("/api/reminders/twiml", (req, res) => {
    // Get the processed message from query parameters
    const message = Array.isArray(req.query.message) ? req.query.message[0] : req.query.message;
    
    console.log("TwiML request received with message:", message);
    
    // Validate message parameter
    if (!message) {
      console.log("TwiML error: Missing message parameter");
      res.set({
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Sorry, there was an error with the reminder message.</Say>
</Response>`);
      return;
    }
    
    // Clean and escape the message for XML
    const cleanMessage = String(message)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    console.log("TwiML cleaned message:", cleanMessage);
    
    // Return TwiML response with proper headers
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${cleanMessage}</Say>
</Response>`;
    
    console.log("Sending TwiML response:", twimlResponse);
    res.send(twimlResponse);
  });

  // Twilio webhook endpoint for call status updates
  app.get("/api/twilio/webhook/status", (req, res) => {
    console.log("Twilio call status update (GET):", req.query);
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });

  app.post("/api/twilio/webhook/status", (req, res) => {
    const { CallSid, CallStatus, From, To } = req.body;
    
    console.log("Twilio call status update (POST):", {
      callSid: CallSid,
      status: CallStatus,
      from: From,
      to: To,
      timestamp: new Date().toISOString()
    });
    
    // Respond with empty TwiML to acknowledge receipt
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });

  // Twilio webhook endpoint for fallback
  app.get("/api/twilio/webhook/fallback", (req, res) => {
    console.log("Twilio fallback webhook called (GET):", req.query);
    console.log("Error Code:", req.query.ErrorCode);
    
    // Try to get the original message from the ErrorUrl query parameters
    const errorUrl = req.query.ErrorUrl;
    let fallbackMessage = "Hello, this is a payment reminder from the fee management system. Please contact us for assistance with your payment.";
    
    if (errorUrl && typeof errorUrl === 'string') {
      try {
        const url = new URL(errorUrl);
        const originalMessage = url.searchParams.get('message');
        if (originalMessage) {
          // Clean the message for XML
          fallbackMessage = decodeURIComponent(originalMessage)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          console.log("Using original message in fallback:", fallbackMessage);
        }
      } catch (e) {
        console.log("Could not parse ErrorUrl, using default fallback message");
      }
    }
    
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${fallbackMessage}</Say>
</Response>`);
  });

  app.post("/api/twilio/webhook/fallback", (req, res) => {
    console.log("Twilio fallback webhook called (POST):", req.body);
    console.log("Error Code:", req.body.ErrorCode);
    
    // Try to get the original message from the ErrorUrl query parameters
    const errorUrl = req.body.ErrorUrl;
    let fallbackMessage = "Hello, this is a payment reminder from the fee management system. Please contact us for assistance with your payment.";
    
    if (errorUrl) {
      try {
        const url = new URL(errorUrl);
        const originalMessage = url.searchParams.get('message');
        if (originalMessage) {
          // Clean the message for XML
          fallbackMessage = decodeURIComponent(originalMessage)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          console.log("Using original message in fallback:", fallbackMessage);
        }
      } catch (e) {
        console.log("Could not parse ErrorUrl, using default fallback message");
      }
    }
    
    res.set({
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${fallbackMessage}</Say>
</Response>`);
  });

  const httpServer = createServer(app);
  return httpServer;
}

