import Groq from "groq-sdk";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Optimized models for real-time streaming
const CHAT_MODEL = "llama-3.3-70b-versatile"; // Fast and accurate
const TRANSCRIPTION_MODEL = "whisper-large-v3-turbo"; // Real-time transcription
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = "hannah";

export interface ChatContext {
  studentName?: string;
  courseName?: string;
  pendingAmount?: string;
  department?: string;
  phone?: string;
  totalFees?: string;
  paidAmount?: string;
  address?: string;
  studentId?: string;
  email?: string;
  language: "en" | "ta";
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  suggestedResponse: string;
  shouldTransfer: boolean;
  department: string;
  requiresFollowup: boolean;
}

// In-memory conversation context storage
const conversationContext: Record<
  string,
  Array<{
    user: string;
    bot: string;
    intent: string;
    timestamp: number;
  }>
> = {};

/**
 * Transcribe audio using Groq Whisper (real-time)
 */
export async function transcribeAudio(audioBuffer: Buffer, filename: string = "audio.wav"): Promise<string> {
  try {
    console.log("Transcribing audio with Groq Whisper...");
    const startTime = Date.now();
    
    // Convert Buffer to Blob for File constructor
    const blob = new Blob([audioBuffer]);
    const file = new File([blob], filename, { type: 'audio/wav' });
    
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: TRANSCRIPTION_MODEL,
      temperature: 0,
      response_format: "json",
    });
    
    const duration = Date.now() - startTime;
    console.log(`Transcription completed in ${duration}ms:`, transcription.text);
    
    return transcription.text || "";
  } catch (error) {
    console.error("Groq transcription error:", error);
    throw error;
  }
}

/**
 * Transcribe audio from file path
 */
export async function transcribeAudioFile(filePath: string): Promise<string> {
  try {
    const audioBuffer = readFileSync(filePath);
    return await transcribeAudio(audioBuffer, filePath.split('/').pop() || 'audio.wav');
  } catch (error) {
    console.error("Groq transcription from file error:", error);
    throw error;
  }
}

/**
 * Generate speech audio using Groq TTS
 */
export async function generateSpeech(text: string, language: "en" | "ta" = "en"): Promise<Buffer> {
  try {
    console.log(`Generating speech with Groq TTS (${text.length} chars)...`);
    const startTime = Date.now();
    
    // Note: Groq TTS currently supports English only
    // For Tamil, we'll need to use a different approach or wait for multilingual support
    const response = await groq.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      response_format: "wav",
      input: text,
    });
    
    const duration = Date.now() - startTime;
    console.log(`Speech generation completed in ${duration}ms`);
    
    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Groq TTS error:", error);
    throw error;
  }
}

/**
 * Generate speech and save to file
 */
export async function generateSpeechToFile(text: string, outputPath: string, language: "en" | "ta" = "en"): Promise<string> {
  try {
    const audioBuffer = await generateSpeech(text, language);
    writeFileSync(outputPath, audioBuffer);
    console.log(`Speech saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("Groq TTS to file error:", error);
    throw error;
  }
}

/**
 * Classify user intent and generate response using Groq
 */
export async function classifyIntentAndRespond(
  userSpeech: string,
  context: ChatContext,
  callSid?: string,
): Promise<IntentClassification> {
  try {
    const startTime = Date.now();
    const isTamil = context.language === "ta";

    // Build conversation context
    const conversationHistory = getConversationContext(callSid || "");

    const systemPrompt = isTamil
      ? `நீங்கள் கல்வி நிறுவனத்தின் குரல் அழைப்பு மையத்திற்கான AI உதவியாளர். 

உங்கள் பங்கு:
1. அழைப்பாளரின் நோக்கத்தை வகைப்படுத்துங்கள்: 'support', 'fee_inquiry', 'payment', 'information', 'general', 'goodbye'
2. சுருக்கமான, உதவிகரமான பதில் உருவாக்குங்கள் (அதிகபட்சம் 2 வாக்கியங்கள்)
3. மனித முகவரிடம் மாற்ற வேண்டுமா என்று முடிவு செய்யுங்கள்

வழிகாட்டுதல்கள்:
- நட்பாக இருங்கள்
- சுருக்கமாக இருங்கள்
- மாணவர் பெயர் மற்றும் குறிப்பிட்ட விவரங்களைப் பயன்படுத்துங்கள்
- பயனர் "போதும்", "இல்லை", "நன்றி", "சரி", "okay" என்று கூறினால் requiresFollowup=false மற்றும் intent='goodbye'
- உரையாடலை முடிக்க வேண்டிய நேரத்தை அறிந்து கொள்ளுங்கள்

MUST respond with valid JSON object with these exact fields:
{
  "intent": "support|fee_inquiry|payment|information|general|goodbye",
  "confidence": 0.8,
  "suggestedResponse": "your response here",
  "shouldTransfer": false,
  "department": "support|fees|information|none",
  "requiresFollowup": true
}`
      : `You are an AI assistant for KIT's call center.

Your role:
1. Classify caller's intent: 'support', 'fee_inquiry', 'payment', 'information', 'general', 'goodbye'
2. Generate brief, helpful response (max 2 sentences)
3. Determine if call should end or continue

Guidelines:
- Be friendly and concise
- ALWAYS use student's name and specific details from context
- Provide exact amounts and course names
- CRITICAL: Set requiresFollowup=false and intent='goodbye' when user says:
  * "goodbye", "bye", "thank you", "thanks", "that's all", "no more questions"
  * "okay", "ok", "alright", "nothing else", "I'm good", "all set", "no"
  * Any phrase indicating they want to end the call
- Know when to end the conversation naturally

MUST respond with valid JSON object with these exact fields:
{
  "intent": "support|fee_inquiry|payment|information|general|goodbye",
  "confidence": 0.8,
  "suggestedResponse": "your response here",
  "shouldTransfer": false,
  "department": "support|fees|information|none",
  "requiresFollowup": true
}

Student Context: KIT (Kalaignar Karunanidhi Institute of Technology)`;

    let contextInfo = "";
    if (context.studentName) contextInfo += `Student: ${context.studentName}\n`;
    if (context.department) contextInfo += `Department: ${context.department}\n`;
    if (context.courseName) contextInfo += `Course: ${context.courseName}\n`;
    if (context.totalFees) contextInfo += `Total Fees: ₹${context.totalFees}\n`;
    if (context.paidAmount) contextInfo += `Paid Amount: ₹${context.paidAmount}\n`;
    if (context.pendingAmount) contextInfo += `Pending Amount: ₹${context.pendingAmount}\n`;
    if (context.phone) contextInfo += `Phone: ${context.phone}\n`;
    if (context.email) contextInfo += `Email: ${context.email}\n`;

    const userMessage = contextInfo.length > 0
      ? `Student Information:\n${contextInfo}\n\nStudent's Question: "${userSpeech}"\n\nProvide personalized response using student details. Respond in JSON format with intent, confidence, suggestedResponse, shouldTransfer, department, and requiresFollowup fields.`
      : `User Query: "${userSpeech}"\n\nRespond in JSON format with intent, confidence, suggestedResponse, shouldTransfer, department, and requiresFollowup fields.`;

    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2, // Lower for more consistent JSON
      max_completion_tokens: 250,
      response_format: { type: "json_object" },
    });

    const duration = Date.now() - startTime;
    console.log(`Intent classification completed in ${duration}ms`);

    const responseText = completion.choices[0]?.message?.content;

    if (responseText) {
      const result = JSON.parse(responseText);

      // Update conversation context
      updateConversationContext(
        callSid || "",
        userSpeech,
        result.suggestedResponse || "",
        result.intent || "general",
      );

      return {
        intent: result.intent || "general",
        confidence: result.confidence || 0.5,
        suggestedResponse: result.suggestedResponse || getDefaultResponse(context.language),
        shouldTransfer: result.shouldTransfer || false,
        department: result.department || "none",
        requiresFollowup: result.requiresFollowup !== false,
      };
    } else {
      return getFallbackResponse(userSpeech, context.language);
    }
  } catch (error) {
    console.error("Groq intent classification error:", error);
    return getFallbackResponse(userSpeech, context.language);
  }
}

/**
 * Generate a follow-up response for continued conversation
 */
export async function generateFollowupResponse(
  userSpeech: string,
  previousIntent: string,
  context: ChatContext,
  callSid?: string,
): Promise<string> {
  try {
    const isTamil = context.language === "ta";
    const conversationHistory = getConversationContext(callSid || "");

    const systemPrompt = isTamil
      ? `முந்தைய நோக்கம்: '${previousIntent}'. சுருக்கமான தொடர்ச்சி பதில் (1-2 வாக்கியங்கள்) உருவாக்குங்கள்.`
      : `Previous intent: '${previousIntent}'. Generate brief follow-up response (1-2 sentences).`;

    const userMessage = `Caller's follow-up: '${userSpeech}'\n\nPrevious: ${conversationHistory}`;

    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_completion_tokens: 100,
    });

    const followupResponse = completion.choices[0]?.message?.content?.trim();

    if (followupResponse) {
      updateConversationContext(
        callSid || "",
        userSpeech,
        followupResponse,
        "followup",
      );
      return followupResponse;
    } else {
      return isTamil
        ? "நன்றி. வேறு ஏதேனும் உதவி தேவையா?"
        : "Thank you. Is there anything else I can help you with?";
    }
  } catch (error) {
    console.error("Groq followup error:", error);
    return context.language === "ta"
      ? "நன்றி. வேறு ஏதேனும் உதவி தேவையா?"
      : "Thank you. Is there anything else I can help you with?";
  }
}

/**
 * Enhanced chat response with comprehensive context
 */
export async function generateChatResponse(
  userMessage: string,
  context: ChatContext,
): Promise<string> {
  try {
    const classification = await classifyIntentAndRespond(userMessage, context);
    return classification.suggestedResponse;
  } catch (error) {
    console.error("Groq chat response error:", error);
    return context.language === "ta"
      ? "மன்னிக்கவும், தற்போது சேவை கிடைக்கவில்லை."
      : "Sorry, the service is currently unavailable.";
  }
}

/**
 * Detect language from text
 */
export async function detectLanguage(text: string): Promise<"en" | "ta"> {
  // Simple detection based on Tamil characters
  const tamilPattern = /[\u0B80-\u0BFF]/;
  return tamilPattern.test(text) ? "ta" : "en";
}

/**
 * Fallback response when Groq is unavailable
 */
function getFallbackResponse(
  userSpeech: string,
  language: "en" | "ta",
): IntentClassification {
  const speechLower = userSpeech.toLowerCase();
  
  // Check for goodbye phrases
  const goodbyePhrases = ['bye', 'goodbye', 'thank you', 'thanks', 'that\'s all', 'no more', 'nothing else', 'okay', 'ok', 'alright'];
  if (goodbyePhrases.some(phrase => speechLower.includes(phrase)) && speechLower.length < 30) {
    return {
      intent: "goodbye",
      confidence: 0.9,
      suggestedResponse: language === 'ta' 
        ? "நன்றி, அழைப்பிற்கு!"
        : "Thank you for calling!",
      shouldTransfer: false,
      department: "none",
      requiresFollowup: false,
    };
  }

  if (language === "ta" || /[\u0B80-\u0BFF]/.test(userSpeech)) {
    if (speechLower.includes("கட்டணம்") || speechLower.includes("fee")) {
      return {
        intent: "fee_inquiry",
        confidence: 0.8,
        suggestedResponse: "கட்டணம் தொடர்பான உங்கள் கேள்வியை புரிந்துகொண்டேன். உங்கள் விவரங்களைச் சரிபார்க்கிறேன்.",
        shouldTransfer: false,
        department: "fees",
        requiresFollowup: true,
      };
    } else if (speechLower.includes("உதவி") || speechLower.includes("help")) {
      return {
        intent: "support",
        confidence: 0.8,
        suggestedResponse: "உங்களுக்கு உதவி தேவை என்பதை புரிந்துகொண்டேன். எங்கள் ஆதரவு குழுவுடன் இணைக்கிறேன்.",
        shouldTransfer: true,
        department: "support",
        requiresFollowup: false,
      };
    } else {
      return {
        intent: "general",
        confidence: 0.5,
        suggestedResponse: "வணக்கம்! நான் உங்களுக்கு கட்டணம் அல்லது பாடநெறி தகவல்களில் உதவ முடியும். என்ன தேவை?",
        shouldTransfer: false,
        department: "none",
        requiresFollowup: true,
      };
    }
  } else {
    if (speechLower.includes("fee") || speechLower.includes("payment") || speechLower.includes("pay")) {
      return {
        intent: "fee_inquiry",
        confidence: 0.8,
        suggestedResponse: "I understand you have a question about fees. Let me check your account details.",
        shouldTransfer: false,
        department: "fees",
        requiresFollowup: true,
      };
    } else if (speechLower.includes("support") || speechLower.includes("help") || speechLower.includes("problem")) {
      return {
        intent: "support",
        confidence: 0.8,
        suggestedResponse: "I understand you need support. Let me connect you with our support team.",
        shouldTransfer: true,
        department: "support",
        requiresFollowup: false,
      };
    } else {
      return {
        intent: "general",
        confidence: 0.5,
        suggestedResponse: "Hello! I can help you with fee inquiries or course information. What do you need?",
        shouldTransfer: false,
        department: "none",
        requiresFollowup: true,
      };
    }
  }
}

/**
 * Get default response
 */
function getDefaultResponse(language: "en" | "ta"): string {
  return language === "ta"
    ? "வணக்கம்! நான் உங்கள் கல்வி நிறுவனத்தின் AI உதவியாளர். எப்படி உதவ முடியும்?"
    : "Hello! I'm your educational institution's AI assistant. How can I help you today?";
}

/**
 * Get conversation context for this call
 */
function getConversationContext(callSid: string): string {
  if (!callSid || !conversationContext[callSid]) {
    return "Start of conversation.";
  }

  const context = conversationContext[callSid];
  const contextLines = [];
  for (const exchange of context.slice(-3)) {
    contextLines.push(`User: ${exchange.user}`);
    contextLines.push(`Bot: ${exchange.bot}`);
  }

  return contextLines.join("\n");
}

/**
 * Update conversation context for this call
 */
function updateConversationContext(
  callSid: string,
  userSpeech: string,
  botResponse: string,
  intent: string,
): void {
  if (!callSid) return;

  if (!conversationContext[callSid]) {
    conversationContext[callSid] = [];
  }

  conversationContext[callSid].push({
    user: userSpeech,
    bot: botResponse,
    intent: intent,
    timestamp: Date.now(),
  });

  // Keep only last 5 exchanges
  if (conversationContext[callSid].length > 5) {
    conversationContext[callSid] = conversationContext[callSid].slice(-5);
  }
}
