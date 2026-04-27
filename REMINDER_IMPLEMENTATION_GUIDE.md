# 📞 Reminder System Implementation Guide

## Current Status

### ✅ Voice Calls Page (AI Conversational)
- Uses `/api/reminders/send` endpoint
- Calls AI webhook at `/api/voice/webhook`
- Interactive conversation with student
- Can answer questions, handle objections
- **This is working correctly!**

### ❌ Reminders Page (Script-based TTS)
- Currently uses same `/api/reminders/send` endpoint
- **Problem**: Calls AI bot instead of reading script
- **Need**: Simple TTS that reads script and hangs up

## Solution Required

### New Endpoint Needed: `/api/reminders/send-script`

This endpoint should:
1. Accept: `phoneNumber`, `scriptMessage`, `studentFeeId`
2. Create Twilio call with TwiML URL (not AI webhook)
3. TwiML speaks the script message
4. Call ends automatically after message

### New TwiML Endpoint: `/api/reminders/twiml-script`

This endpoint should:
1. Accept: `message` as query parameter
2. Generate TwiML with `<Say>` verb
3. Speak the message
4. Hang up with `<Hangup>`

## Implementation Code

### 1. Add to server/routes.ts (after line 756):

```typescript
// Script-based reminder (TTS only, no AI)
app.post("/api/reminders/send-script", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { studentFeeId, phoneNumber, scriptMessage } = req.body;

    if (!studentFeeId || !phoneNumber || !scriptMessage) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      return res.status(503).json({ message: "Twilio not configured" });
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const baseUrl = process.env.PUBLIC_URL || 
      (process.env.REPLIT_DOMAINS ? 
        `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 
        req.get('host')?.includes('localhost') ? 
          `http://${req.get('host')}` : 
          `https://${req.get('host')}`);

    // Encode message for URL
    const encodedMessage = encodeURIComponent(scriptMessage);

    const call = await twilioClient.calls.create({
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      url: `${baseUrl}/api/reminders/twiml-script?message=${encodedMessage}`,
      statusCallback: `${baseUrl}/api/voice/call-status`,
      statusCallbackMethod: 'POST',
      timeout: 30,
      record: false
    });

    const reminderData = {
      studentFeeId: parseInt(studentFeeId),
      type: "voice" as const,
      status: "sent" as const,
      twilioCallSid: call.sid,
      message: scriptMessage,
      sentAt: new Date(),
    };

    const reminder = await storage.createReminder(reminderData);
    
    res.status(200).json({ 
      success: true,
      message: "Script reminder sent successfully", 
      reminder,
      callSid: call.sid
    });
  } catch (error: any) {
    console.error("Send script reminder error:", error);
    res.status(500).json({ message: "Failed to send script reminder" });
  }
});

// TwiML endpoint for script-based reminders
app.get("/api/reminders/twiml-script", (req, res) => {
  const message = req.query.message as string || "This is a payment reminder.";
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="en-IN">${message}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});
```

### 2. Update client/src/pages/Reminders.tsx:

Change the mutation to use the new endpoint:

```typescript
const sendInstantReminderMutation = useMutation({
  mutationFn: async (data: any) => {
    const response = await apiRequest("POST", "/api/reminders/send-script", data);
    return response.json();
  },
  // ... rest stays the same
});

const handleSendInstant = () => {
  // ... validation code ...
  
  const personalizedMessage = reminderScript
    .replace('{studentName}', `${selectedFee.student.firstName} ${selectedFee.student.lastName}`)
    .replace('{pendingAmount}', selectedFee.pendingAmount.toString())
    .replace('{courseName}', selectedFee.course.name);

  sendInstantReminderMutation.mutate({
    studentFeeId: selectedFee.id,
    phoneNumber: selectedFee.student.phone,
    scriptMessage: personalizedMessage, // Changed from customMessage
  });
};
```

## Result

After implementation:

### Voice Calls Page:
- Click "Initiate Call" → AI conversational bot
- Can interact, answer questions
- Smart conversation

### Reminders Page:
- Edit script template
- Click "Send Now" → Reads script and hangs up
- No interaction, just message delivery
- Can send to multiple students

## Testing

1. Go to Reminders page
2. Edit script: "Hello {studentName}, you have ₹{pendingAmount} pending for {courseName}"
3. Select student
4. Click "Call Now"
5. Should hear: "Hello John Doe, you have ₹5000 pending for Web Development"
6. Call ends automatically

---

**Status**: Implementation needed in server/routes.ts
**Files to modify**: 
- server/routes.ts (add 2 new endpoints)
- client/src/pages/Reminders.tsx (change endpoint call)
