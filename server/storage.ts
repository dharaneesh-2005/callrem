import {
  users, courses, students, studentFees, payments, reminders, callLogs, conversationLogs,
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Student, type InsertStudent,
  type StudentFee, type InsertStudentFee,
  type Payment, type InsertPayment,
  type Reminder, type InsertReminder,
  type CallLog, type InsertCallLog,
  type ConversationLog, type InsertConversationLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  getStudentByEmail(email: string): Promise<Student | undefined>;

  // Student Fee operations
  getStudentFees(): Promise<any[]>;
  getStudentFee(id: number): Promise<any | undefined>;
  createStudentFee(studentFee: InsertStudentFee): Promise<StudentFee>;
  updateStudentFee(id: number, updates: Partial<InsertStudentFee>): Promise<StudentFee | undefined>;
  getStudentFeesByStudent(studentId: number): Promise<any[]>;
  getPendingStudentFees(): Promise<any[]>;

  // Payment operations
  getPayments(): Promise<any[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByStudentFee(studentFeeId: number): Promise<Payment[]>;

  // Reminder operations
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getReminders(): Promise<any[]>;
  updateReminder(id: number, updates: Partial<InsertReminder>): Promise<Reminder | undefined>;

  // Call log operations
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  getCallLogs(): Promise<CallLog[]>;
  updateCallLog(callSid: string, updates: Partial<InsertCallLog>): Promise<CallLog | undefined>;
  getCallLogByCallSid(callSid: string): Promise<CallLog | undefined>;

  // Conversation log operations
  createConversationLog(conversationLog: InsertConversationLog): Promise<ConversationLog>;
  getConversationLogs(): Promise<any[]>;
  getConversationLogsByCallSid(callSid: string): Promise<ConversationLog[]>;

  // Statistics
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true)).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const [course] = await db
      .update(courses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return !!course;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.isActive, true)).orderBy(desc(students.createdAt));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const [student] = await db
      .update(students)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return !!student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student;
  }

  // Student Fee operations
  async getStudentFees(): Promise<any[]> {
    return await db
      .select({
        id: studentFees.id,
        totalFee: studentFees.totalFee,
        paidAmount: studentFees.paidAmount,
        pendingAmount: studentFees.pendingAmount,
        dueDate: studentFees.dueDate,
        status: studentFees.status,
        createdAt: studentFees.createdAt,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          phone: students.phone,
          studentId: students.studentId,
        },
        course: {
          id: courses.id,
          name: courses.name,
          feeAmount: courses.feeAmount,
        },
      })
      .from(studentFees)
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .orderBy(desc(studentFees.createdAt));
  }

  async getStudentFee(id: number): Promise<any | undefined> {
    const [studentFee] = await db
      .select({
        id: studentFees.id,
        totalFee: studentFees.totalFee,
        paidAmount: studentFees.paidAmount,
        pendingAmount: studentFees.pendingAmount,
        dueDate: studentFees.dueDate,
        status: studentFees.status,
        createdAt: studentFees.createdAt,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          phone: students.phone,
          studentId: students.studentId,
        },
        course: {
          id: courses.id,
          name: courses.name,
          feeAmount: courses.feeAmount,
        },
      })
      .from(studentFees)
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .where(eq(studentFees.id, id));
    return studentFee;
  }

  async createStudentFee(studentFee: InsertStudentFee): Promise<StudentFee> {
    const [newStudentFee] = await db.insert(studentFees).values(studentFee).returning();
    return newStudentFee;
  }

  async updateStudentFee(id: number, updates: Partial<InsertStudentFee>): Promise<StudentFee | undefined> {
    const [studentFee] = await db
      .update(studentFees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(studentFees.id, id))
      .returning();
    return studentFee;
  }

  async getStudentFeesByStudent(studentId: number): Promise<any[]> {
    return await db
      .select({
        id: studentFees.id,
        totalFee: studentFees.totalFee,
        paidAmount: studentFees.paidAmount,
        pendingAmount: studentFees.pendingAmount,
        dueDate: studentFees.dueDate,
        status: studentFees.status,
        createdAt: studentFees.createdAt,
        course: {
          id: courses.id,
          name: courses.name,
          description: courses.description,
          feeAmount: courses.feeAmount,
        },
      })
      .from(studentFees)
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .where(eq(studentFees.studentId, studentId))
      .orderBy(desc(studentFees.createdAt));
  }

  async getPendingStudentFees(): Promise<any[]> {
    return await db
      .select({
        id: studentFees.id,
        totalFee: studentFees.totalFee,
        paidAmount: studentFees.paidAmount,
        pendingAmount: studentFees.pendingAmount,
        dueDate: studentFees.dueDate,
        status: studentFees.status,
        createdAt: studentFees.createdAt,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          phone: students.phone,
          studentId: students.studentId,
        },
        course: {
          id: courses.id,
          name: courses.name,
          feeAmount: courses.feeAmount,
        },
      })
      .from(studentFees)
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .where(or(eq(studentFees.status, "pending"), eq(studentFees.status, "partial")))
      .orderBy(desc(studentFees.dueDate));
  }

  // Payment operations
  async getPayments(): Promise<any[]> {
    return await db
      .select({
        id: payments.id,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        transactionId: payments.transactionId,
        razorpayPaymentId: payments.razorpayPaymentId,
        status: payments.status,
        notes: payments.notes,
        receiptNumber: payments.receiptNumber,
        createdAt: payments.createdAt,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          email: students.email,
          phone: students.phone,
        },
        course: {
          id: courses.id,
          name: courses.name,
        },
      })
      .from(payments)
      .leftJoin(studentFees, eq(payments.studentFeeId, studentFees.id))
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentsByStudentFee(studentFeeId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.studentFeeId, studentFeeId)).orderBy(desc(payments.createdAt));
  }

  // Reminder operations
  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async getReminders(): Promise<any[]> {
    return await db
      .select({
        id: reminders.id,
        type: reminders.type,
        status: reminders.status,
        twilioCallSid: reminders.twilioCallSid,
        message: reminders.message,
        scheduledAt: reminders.scheduledAt,
        sentAt: reminders.sentAt,
        createdAt: reminders.createdAt,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          phone: students.phone,
        },
        course: {
          id: courses.id,
          name: courses.name,
        },
        studentFee: {
          id: studentFees.id,
          pendingAmount: studentFees.pendingAmount,
        },
      })
      .from(reminders)
      .leftJoin(studentFees, eq(reminders.studentFeeId, studentFees.id))
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .orderBy(desc(reminders.createdAt));
  }

  async updateReminder(id: number, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set(updates)
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  // Call log operations
  async createCallLog(callLog: InsertCallLog): Promise<CallLog> {
    const [newCallLog] = await db.insert(callLogs).values(callLog).returning();
    return newCallLog;
  }

  async getCallLogs(): Promise<CallLog[]> {
    return await db.select().from(callLogs).orderBy(desc(callLogs.createdAt));
  }

  async updateCallLog(callSid: string, updates: Partial<InsertCallLog>): Promise<CallLog | undefined> {
    const [callLog] = await db
      .update(callLogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callLogs.callSid, callSid))
      .returning();
    return callLog;
  }

  async getCallLogByCallSid(callSid: string): Promise<CallLog | undefined> {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.callSid, callSid));
    return callLog;
  }

  // Conversation log operations
  async createConversationLog(conversationLog: InsertConversationLog): Promise<ConversationLog> {
    const [newConversationLog] = await db.insert(conversationLogs).values(conversationLog).returning();
    return newConversationLog;
  }

  async getConversationLogs(): Promise<any[]> {
    return await db
      .select({
        id: conversationLogs.id,
        callSid: conversationLogs.callSid,
        userSpeech: conversationLogs.userSpeech,
        botResponse: conversationLogs.botResponse,
        intent: conversationLogs.intent,
        confidence: conversationLogs.confidence,
        language: conversationLogs.language,
        timestamp: conversationLogs.timestamp,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          phone: students.phone,
        },
      })
      .from(conversationLogs)
      .leftJoin(students, eq(conversationLogs.studentId, students.id))
      .orderBy(desc(conversationLogs.timestamp));
  }

  async getConversationLogsByCallSid(callSid: string): Promise<ConversationLog[]> {
    return await db.select().from(conversationLogs).where(eq(conversationLogs.callSid, callSid));
  }

  // Statistics
  async getDashboardStats(): Promise<any> {
    const totalStudents = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.isActive, true));

    const totalCourses = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(eq(courses.isActive, true));

    const pendingPayments = await db
      .select({ 
        total: sql<number>`sum(${studentFees.pendingAmount})`,
        count: sql<number>`count(*)`
      })
      .from(studentFees)
      .where(or(eq(studentFees.status, "pending"), eq(studentFees.status, "partial")));

    const todayPayments = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(
        and(
          eq(payments.status, "success"),
          sql`DATE(${payments.createdAt}) = CURRENT_DATE`
        )
      );

    return {
      totalStudents: totalStudents[0]?.count || 0,
      totalCourses: totalCourses[0]?.count || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      pendingPaymentsCount: pendingPayments[0]?.count || 0,
      collectedToday: todayPayments[0]?.total || 0,
    };
  }
}

export const storage = new DatabaseStorage();
