import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
 * Classify user intent and generate response using Gemini AI
 * Similar to the Python Flask version's classify_intent_and_respond function
 */
export async function classifyIntentAndRespond(
  userSpeech: string,
  context: ChatContext,
  callSid?: string,
): Promise<IntentClassification> {
  try {
    const isTamil = context.language === "ta";

    // Build conversation context
    const conversationHistory = getConversationContext(callSid || "");

    const systemPrompt = isTamil
      ? `நீங்கள் கல்வி நிறுவனத்தின் குரல் அழைப்பு மையத்திற்கான நிபுணத்துவ AI உதவியாளர். 

உங்கள் பங்கு:
1. அழைப்பாளரின் நோக்கத்தை இவற்றில் ஒன்றாக வகைப்படுத்துங்கள்: 'support', 'fee_inquiry', 'payment', 'information', 'general'
2. உதவிகரமான, இயற்கையான பதில் உருவாக்குங்கள் (குரல் அழைப்புகளுக்கு அதிகபட்சம் 2 வாக்கியங்கள்)
3. அழைப்பை மனித முகவரிடம் மாற்ற வேண்டுமா என்று முடிவு செய்யுங்கள்
4. தேவைப்பட்டால் எந்த துறைக்கு மாற்ற வேண்டும் என்று குறிப்பிடுங்கள்

வழிகாட்டுதல்கள்:
- பதில்கள் உரையாடல் மற்றும் நட்பாக இருக்க வேண்டும்
- கட்டணம் தொடர்பான பிரச்சினைகளுக்கு: சிக்கலை ஒப்புக்கொண்டு அடுத்த படிகளை விளக்குங்கள்
- கட்டணம் விசாரணைகளுக்கு: உற்சாகம் காட்டி அடிப்படை தேவைகளை சேகரிக்கவும்
- தகவல் கோரிக்கைகளுக்கு: பயனுள்ள விவரங்களை வழங்கவும்
- தொலைபேசி உரையாடல்களுக்கு ஏற்ற எளிய மொழியைப் பயன்படுத்துங்கள்
- சுருக்கமாக இருங்கள் - குரல் பதில்கள் குறுகியதாக இருக்க வேண்டும்
- முக்கியம்: பயனர் "போதும்", "இல்லை", "நன்றி" போன்று கூறாத வரை எல்லா பதில்களுக்கும் requiresFollowup=true அமைக்கவும்
- உரையாடலைத் தொடர்ந்து உதவிகரமாக இருங்கள்`
      : `You are a professional voice assistant for an KIT's call center.

Your role is to:
1. Classify the caller's intent into one of: 'support', 'fee_inquiry', 'payment', 'information', 'general'
2. Generate a helpful, natural response (maximum 2 sentences for voice calls)
3. Determine if the call should be transferred to a human agent
4. Specify which department to transfer to if needed

Guidelines:
- Keep responses conversational and friendly
- For fee issues: acknowledge the problem and explain next steps  
- For fee inquiries: Use the student's exact pending amount and details from context
- For information requests: provide helpful details using student's personal information
- Use simple language suitable for phone conversations
- Be concise - voice responses should be brief
- ALWAYS use the student's name and specific details when available
- Provide exact fee amounts, department names, and course information from context
- CRITICAL: Set requiresFollowup=true for ALL responses unless user explicitly says "goodbye", "no more questions", "that's all", or similar farewell phrases
- Continue conversations by being helpful and asking if they need more assistance

IMPORTANT: When student context is available, give personalized responses with specific details like:
- "Hello [name], your pending fee is ₹[exact amount] for [course/department]"
- "You have paid ₹[amount] out of ₹[total], leaving ₹[pending] remaining"
- Use their exact phone number, email, and address details when relevant

Student Context Information:
- Institution: Educational fee management system
- Services: Fee payments, course enrollment, student support
- Contact: Current phone call`;

    let contextInfo = "";
    if (context.studentName) {
      contextInfo += isTamil
        ? `மாணவர்: ${context.studentName}\n`
        : `Student: ${context.studentName}\n`;
    }
    if (context.department) {
      contextInfo += isTamil
        ? `துறை: ${context.department}\n`
        : `Department: ${context.department}\n`;
    }
    if (context.courseName) {
      contextInfo += isTamil
        ? `பாடநெறி: ${context.courseName}\n`
        : `Course: ${context.courseName}\n`;
    }
    if (context.totalFees) {
      contextInfo += isTamil
        ? `மொத்த கட்டணம்: ₹${context.totalFees}\n`
        : `Total Fees: ₹${context.totalFees}\n`;
    }
    if (context.paidAmount) {
      contextInfo += isTamil
        ? `செலுத்திய தொகை: ₹${context.paidAmount}\n`
        : `Paid Amount: ₹${context.paidAmount}\n`;
    }
    if (context.pendingAmount) {
      contextInfo += isTamil
        ? `நிலுவையில் உள்ள தொகை: ₹${context.pendingAmount}\n`
        : `Pending Amount: ₹${context.pendingAmount}\n`;
    }
    if (context.phone) {
      contextInfo += isTamil
        ? `தொலைபேசி: ${context.phone}\n`
        : `Phone: ${context.phone}\n`;
    }
    if (context.email) {
      contextInfo += isTamil
        ? `மின்னஞ்சல்: ${context.email}\n`
        : `Email: ${context.email}\n`;
    }
    if (context.address) {
      contextInfo += isTamil
        ? `முகவரி: ${context.address}\n`
        : `Address: ${context.address}\n`;
    }
    if (context.studentId) {
      contextInfo += isTamil
        ? `மாணவர் அடையாள எண்: ${context.studentId}\n`
        : `Student ID: ${context.studentId}\n`;
    }

    // Enhanced prompt for better personalized responses
    const enhancedPrompt = isTamil
      ? `${systemPrompt}\n\nமாணவர் தகவல்:\n${contextInfo}\n\nமாணவரின் கேள்வி: "${userSpeech}"\n\nமேற்கண்ட மாணவர் தகவல்களைப் பயன்படுத்தி தனிப்பயனாக்கப்பட்ட பதிலை வழங்கவும். மாணவரின் பெயர், நிலுவைத் தொகை, பாடநெறி போன்ற குறிப்பிட்ட விவரங்களைப் பயன்படுத்தவும்.`
      : `${systemPrompt}\n\nStudent Information:\n${contextInfo}\n\nStudent's Question: "${userSpeech}"\n\nProvide a personalized response using the above student information. Use specific details like the student's name, pending amount, course, etc. in your response.`;

    const prompt =
      contextInfo.length > 0
        ? enhancedPrompt
        : `${systemPrompt}\n\nUser Query: "${userSpeech}"`;

    console.log("Gemini prompt:", {
      hasContext: contextInfo.length > 0,
      contextLength: contextInfo.length,
      language: context.language,
      userSpeech,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: prompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            intent: {
              type: "string",
              enum: [
                "support",
                "fee_inquiry",
                "payment",
                "information",
                "general",
              ],
            },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            suggestedResponse: { type: "string" },
            shouldTransfer: { type: "boolean" },
            department: {
              type: "string",
              enum: ["support", "fees", "information", "none"],
            },
            requiresFollowup: { 
              type: "boolean",
              description: "Should be true unless user explicitly says goodbye/no more questions" 
            },
          },
          required: [
            "intent",
            "confidence",
            "suggestedResponse",
            "shouldTransfer",
            "department",
            "requiresFollowup",
          ],
        },
        temperature: 0.3,
      },
      contents: `User query: "${userSpeech}"\n\nPlease analyze this query and provide a response using the context provided above.`,
    });

    if (response.text) {
      const result = JSON.parse(response.text);

      // Update conversation context
      updateConversationContext(
        callSid || "",
        userSpeech,
        result.suggestedResponse,
        result.intent,
      );

      console.log("Gemini intent classification:", {
        intent: result.intent,
        confidence: result.confidence,
        shouldTransfer: result.shouldTransfer,
        department: result.department,
      });

      return {
        intent: result.intent,
        confidence: result.confidence,
        suggestedResponse: result.suggestedResponse,
        shouldTransfer: result.shouldTransfer,
        department: result.department,
        requiresFollowup: result.requiresFollowup,
      };
    } else {
      return getFallbackResponse(userSpeech, context.language);
    }
  } catch (error) {
    console.error("Gemini intent classification error:", error);
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
      ? `நீங்கள் ஒரு உரையாடலைத் தொடர்கிறீர்கள், அங்கு முந்தைய நோக்கம் '${previousIntent}' ஆக இருந்தது.
      
ஒரு சுருக்கமான, உதவிகரமான தொடர்ச்சி பதில் (அதிகபட்சம் 1-2 வாக்கியங்கள்) உருவாக்குங்கள்:
1. அழைப்பாளர் சொன்னதை ஒப்புக்கொள்ளுங்கள்
2. பயனுள்ள தகவல் அல்லது அடுத்த படிகளை வழங்குங்கள்
3. உரையாடல் ஓட்டத்தை பராமரிக்கவும்

தொலைபேசி அழைப்புக்கு இயற்கையாகவும் உரையாடலாகவும் வைத்துக் கொள்ளுங்கள்.`
      : `You are continuing a conversation where the previous intent was '${previousIntent}'.
      
Generate a brief, helpful follow-up response (1-2 sentences max) that:
1. Acknowledges what the caller just said
2. Provides useful information or next steps
3. Maintains the conversation flow

Keep it natural and conversational for a phone call.`;

    const userMessage = isTamil
      ? `அழைப்பாளரின் தொடர்ச்சி: '${userSpeech}'\n\nமுந்தைய உரையாடல்: ${conversationHistory}`
      : `Caller's follow-up: '${userSpeech}'\n\nPrevious conversation: ${conversationHistory}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 100,
        temperature: 0.4,
      },
      contents: userMessage,
    });

    if (response.text) {
      const followupResponse = response.text.trim();
      updateConversationContext(
        callSid || "",
        userSpeech,
        followupResponse,
        "followup",
      );
      return followupResponse;
    } else {
      return isTamil
        ? "அந்த தகவலுக்கு நன்றி. வேறு ஏதேனும் உதவி தேவையா?"
        : "Thank you for that information. Is there anything else I can help you with?";
    }
  } catch (error) {
    console.error("Gemini followup generation error:", error);
    return context.language === "ta"
      ? "அந்த தகவலுக்கு நன்றி. வேறு ஏதேனும் உதவி தேவையா?"
      : "Thank you for that information. Is there anything else I can help you with?";
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
    console.error("Gemini chat response error:", error);
    return context.language === "ta"
      ? "மன்னிக்கவும், தற்போது சேவை கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்."
      : "Sorry, the service is currently unavailable. Please try again later.";
  }
}

/**
 * Fallback response when Gemini is unavailable
 */
function getFallbackResponse(
  userSpeech: string,
  language: "en" | "ta",
): IntentClassification {
  const speechLower = userSpeech.toLowerCase();

  if (language === "ta" || /[\u0B80-\u0BFF]/.test(userSpeech)) {
    // Tamil fallback responses
    if (
      speechLower.includes("கட்டணம்") ||
      speechLower.includes("பணம்") ||
      speechLower.includes("fee")
    ) {
      return {
        intent: "fee_inquiry",
        confidence: 0.8,
        suggestedResponse:
          "கட்டணம் தொடர்பான உங்கள் கேள்வியை புரிந்துகொண்டேன். உங்கள் விவரங்களைச் சரிபார்க்கிறேன்.",
        shouldTransfer: false,
        department: "fees",
        requiresFollowup: true,
      };
    } else if (
      speechLower.includes("உதவி") ||
      speechLower.includes("பிரச்சினை") ||
      speechLower.includes("help")
    ) {
      return {
        intent: "support",
        confidence: 0.8,
        suggestedResponse:
          "உங்களுக்கு உதவி தேவை என்பதை புரிந்துகொண்டேன். எங்கள் ஆதரவு குழுவுடன் இணைக்கிறேன்.",
        shouldTransfer: true,
        department: "support",
        requiresFollowup: false,
      };
    } else {
      return {
        intent: "general",
        confidence: 0.5,
        suggestedResponse:
          "வணக்கம்! நான் உங்களுக்கு கட்டணம், பாடநெறி அல்லது பொதுவான தகவல்களில் உதவ முடியும். தயவுசெய்து குறிப்பாக என்ன தேவை என்று சொல்லுங்கள்?",
        shouldTransfer: false,
        department: "none",
        requiresFollowup: true,
      };
    }
  } else {
    // English fallback responses
    if (
      speechLower.includes("fee") ||
      speechLower.includes("payment") ||
      speechLower.includes("money") ||
      speechLower.includes("pay")
    ) {
      return {
        intent: "fee_inquiry",
        confidence: 0.8,
        suggestedResponse:
          "I understand you have a question about fees. Let me check your account details.",
        shouldTransfer: false,
        department: "fees",
        requiresFollowup: true,
      };
    } else if (
      speechLower.includes("support") ||
      speechLower.includes("help") ||
      speechLower.includes("problem") ||
      speechLower.includes("issue")
    ) {
      return {
        intent: "support",
        confidence: 0.8,
        suggestedResponse:
          "I understand you need technical support. Let me connect you with our support team right away.",
        shouldTransfer: true,
        department: "support",
        requiresFollowup: false,
      };
    } else if (
      speechLower.includes("hours") ||
      speechLower.includes("location") ||
      speechLower.includes("information") ||
      speechLower.includes("address")
    ) {
      return {
        intent: "information",
        confidence: 0.7,
        suggestedResponse:
          "I can help you with information about our institution. What specific details do you need?",
        shouldTransfer: false,
        department: "information",
        requiresFollowup: true,
      };
    } else {
      return {
        intent: "general",
        confidence: 0.5,
        suggestedResponse:
          "Hello! I can help you with fee inquiries, course information, or general questions. Could you please be more specific about what you need?",
        shouldTransfer: false,
        department: "none",
        requiresFollowup: true,
      };
    }
  }
}

/**
 * Get conversation context for this call
 */
function getConversationContext(callSid: string): string {
  if (!callSid || !conversationContext[callSid]) {
    return "This is the start of the conversation.";
  }

  const context = conversationContext[callSid];
  const contextLines = [];
  for (const exchange of context.slice(-3)) {
    // Last 3 exchanges
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

  // Keep only last 5 exchanges to manage memory
  if (conversationContext[callSid].length > 5) {
    conversationContext[callSid] = conversationContext[callSid].slice(-5);
  }
}

export async function detectLanguage(text: string): Promise<"en" | "ta"> {
  try {
    // Simple detection based on Tamil characters
    const tamilPattern = /[\u0B80-\u0BFF]/;
    if (tamilPattern.test(text)) {
      return "ta";
    }

    // Use Gemini for more sophisticated detection if needed
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            language: { type: "string", enum: ["en", "ta"] },
          },
          required: ["language"],
        },
      },
      contents: `Detect if this text is in English (en) or Tamil (ta): "${text}"`,
    });

    const result = JSON.parse(response.text || '{"language": "en"}');
    return result.language === "ta" ? "ta" : "en";
  } catch {
    return "en"; // Default to English if detection fails
  }
}
