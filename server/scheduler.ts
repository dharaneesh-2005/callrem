// Scheduler for processing scheduled reminders
import { db } from './db';
import { reminders, studentFees, students, courses } from '../shared/schema';
import { eq, and, lte } from 'drizzle-orm';

// Shared Twilio client instance
let twilioClient: any = null;
let TWILIO_PHONE_NUMBER: string | undefined = undefined;

// Function to set Twilio client from routes.ts
export function setTwilioClient(client: any, phoneNumber: string) {
  twilioClient = client;
  TWILIO_PHONE_NUMBER = phoneNumber;
  console.log('Scheduler: Twilio client set from routes');
}

export async function processScheduledReminders() {
  try {
    console.log('Checking for scheduled reminders...');
    
    // Get all scheduled reminders that are due (scheduledAt <= now)
    const dueReminders = await db
      .select({
        id: reminders.id,
        studentFeeId: reminders.studentFeeId,
        message: reminders.message,
        scheduledAt: reminders.scheduledAt,
        student: {
          firstName: students.firstName,
          lastName: students.lastName,
          phone: students.phone,
        },
        course: {
          name: courses.name,
        },
        studentFee: {
          pendingAmount: studentFees.pendingAmount,
        },
      })
      .from(reminders)
      .leftJoin(studentFees, eq(reminders.studentFeeId, studentFees.id))
      .leftJoin(students, eq(studentFees.studentId, students.id))
      .leftJoin(courses, eq(studentFees.courseId, courses.id))
      .where(
        and(
          eq(reminders.status, 'scheduled'),
          lte(reminders.scheduledAt, new Date())
        )
      );

    if (dueReminders.length === 0) {
      console.log('No scheduled reminders due at this time');
      return;
    }

    console.log(`Processing ${dueReminders.length} scheduled reminders`);

    for (const reminder of dueReminders) {
      try {
        if (!twilioClient || !TWILIO_PHONE_NUMBER) {
          console.log('Twilio not configured, marking reminder as failed');
          console.log('Twilio client:', !!twilioClient, 'Phone number:', !!TWILIO_PHONE_NUMBER);
          console.log('Environment vars:', {
            accountSid: !!process.env.TWILIO_ACCOUNT_SID,
            authToken: !!process.env.TWILIO_AUTH_TOKEN,
            phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
          });
          await updateReminderStatus(reminder.id, 'failed');
          continue;
        }

        // Format phone number
        const formattedPhone = reminder.student.phone.startsWith('+') 
          ? reminder.student.phone 
          : `+91${reminder.student.phone}`;

        // Clean the message for TwiML (escape XML characters, preserve Tamil text)
        const cleanMessage = reminder.message
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .trim();

        // Detect language from message content (Tamil Unicode range)
        const isTamil = /[\u0B80-\u0BFF]/.test(cleanMessage);
        const twimlLanguage = isTamil ? 'ta-IN' : 'en-IN';
        const voiceName = isTamil ? 'Google.ta-IN-Standard-A' : 'alice';

        // Create inline TwiML for scheduled reminders with proper language support
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voiceName}" language="${twimlLanguage}">${cleanMessage}</Say>
</Response>`;

        console.log("Scheduler using inline TwiML for call:", {
          to: formattedPhone,
          language: twimlLanguage,
          voice: voiceName,
          isTamil: isTamil,
          cleanedMessage: cleanMessage,
          twimlLength: twiml.length
        });

        // Make the call with inline TwiML using Free VoIP or Twilio
        const callClient = twilioClient; // This will be either Free VoIP or Twilio from setTwilioClient
        const call = await callClient.calls.create({
          twiml: twiml,
          to: formattedPhone,
          from: TWILIO_PHONE_NUMBER,
          timeout: 30,
          record: false,
          machineDetection: 'Enable',
        });

        // Update reminder status to sent
        await updateReminderStatus(reminder.id, 'sent', call.sid);
        
        console.log(`Scheduled reminder sent successfully to ${reminder.student.firstName} ${reminder.student.lastName}`);
        
        // Add delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to send scheduled reminder ${reminder.id}:`, error);
        await updateReminderStatus(reminder.id, 'failed');
      }
    }
    
  } catch (error) {
    console.error('Error processing scheduled reminders:', error);
  }
}

async function updateReminderStatus(reminderId: number, status: string, twilioCallSid?: string) {
  try {
    const updateData: any = {
      status,
      sentAt: new Date(),
    };
    
    if (twilioCallSid) {
      updateData.twilioCallSid = twilioCallSid;
    }
    
    await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, reminderId));
      
  } catch (error) {
    console.error(`Failed to update reminder ${reminderId} status:`, error);
  }
}

// Start the scheduler - runs every minute
export function startScheduler() {
  console.log('Starting reminder scheduler...');
  
  // Process immediately on start
  processScheduledReminders();
  
  // Then run every minute
  setInterval(processScheduledReminders, 60000); // 60 seconds
}