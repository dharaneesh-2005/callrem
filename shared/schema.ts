import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  totpSecret: text("totp_secret"),
  isActive: boolean("is_active").default(true),
  role: text("role").default("admin").notNull(),
  isFirstUser: boolean("is_first_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: text("duration").notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address"),
  studentId: text("student_id").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student Fees table (assignment of students to courses)
export const studentFees = pgTable("student_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  totalFee: decimal("total_fee", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  pendingAmount: decimal("pending_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"), // pending, partial, paid
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentFeeId: integer("student_fee_id").notNull().references(() => studentFees.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // razorpay, cash, bank_transfer, cheque
  transactionId: text("transaction_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  status: text("status").default("success"), // success, failed, pending
  notes: text("notes"),
  receiptNumber: text("receipt_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id),
  type: text("type").notNull(), // voice, sms
  status: text("status").notNull(), // sent, delivered, failed, pending, scheduled
  twilioCallSid: text("twilio_call_sid"),
  message: text("message"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Call logs table for tracking voice conversations
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  callSid: text("call_sid").notNull().unique(),
  toNumber: text("to_number").notNull(),
  fromNumber: text("from_number").notNull(),
  status: text("status").notNull().default("initiated"), // initiated, in-progress, completed, failed
  duration: integer("duration").default(0), // Duration in seconds
  speechResults: text("speech_results"), // JSON string of speech interactions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversation logs table for detailed conversation tracking
export const conversationLogs = pgTable("conversation_logs", {
  id: serial("id").primaryKey(),
  callSid: text("call_sid").notNull(),
  userSpeech: text("user_speech"),
  botResponse: text("bot_response"),
  intent: text("intent"), // support, sales, general, etc.
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.0"),
  language: text("language").default("en"), // en, ta
  studentId: integer("student_id").references(() => students.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const coursesRelations = relations(courses, ({ many }) => ({
  studentFees: many(studentFees),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  studentFees: many(studentFees),
}));

export const studentFeesRelations = relations(studentFees, ({ one, many }) => ({
  student: one(students, {
    fields: [studentFees.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [studentFees.courseId],
    references: [courses.id],
  }),
  payments: many(payments),
  reminders: many(reminders),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [payments.studentFeeId],
    references: [studentFees.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  studentFee: one(studentFees, {
    fields: [reminders.studentFeeId],
    references: [studentFees.id],
  }),
}));

export const conversationLogsRelations = relations(conversationLogs, ({ one }) => ({
  student: one(students, {
    fields: [conversationLogs.studentId],
    references: [students.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationLogSchema = createInsertSchema(conversationLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type StudentFee = typeof studentFees.$inferSelect;
export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

export type ConversationLog = typeof conversationLogs.$inferSelect;
export type InsertConversationLog = z.infer<typeof insertConversationLogSchema>;
