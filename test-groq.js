// Quick test script to verify Groq API key works
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  console.log("Testing Groq API connection...\n");
  
  try {
    console.log("1. Testing chat completion...");
    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with a JSON object containing 'status' and 'message' fields."
        },
        {
          role: "user",
          content: "Say hello and confirm you're working"
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 100,
      response_format: { type: "json_object" }
    });
    
    const duration = Date.now() - startTime;
    const response = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    console.log("✅ Chat completion successful!");
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
    console.log();
    
    console.log("2. Testing intent classification...");
    const intentStart = Date.now();
    
    const intentCompletion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `Classify user intent into: 'fee_inquiry', 'support', 'payment', 'information', 'general'.
Respond with JSON: { "intent": "...", "confidence": 0.0-1.0, "suggestedResponse": "..." }`
        },
        {
          role: "user",
          content: "What is my pending fee amount?"
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 150,
      response_format: { type: "json_object" }
    });
    
    const intentDuration = Date.now() - intentStart;
    const intentResponse = JSON.parse(intentCompletion.choices[0]?.message?.content || "{}");
    
    console.log("✅ Intent classification successful!");
    console.log(`   Response time: ${intentDuration}ms`);
    console.log(`   Intent: ${intentResponse.intent}`);
    console.log(`   Confidence: ${intentResponse.confidence}`);
    console.log(`   Response: ${intentResponse.suggestedResponse}`);
    console.log();
    
    console.log("🎉 All tests passed!");
    console.log("\nYour Groq API key is working correctly.");
    console.log("You can now start your application with: npm run dev");
    
  } catch (error) {
    console.error("❌ Test failed!");
    console.error("\nError details:");
    
    if (error.status === 401) {
      console.error("   Invalid API key. Please check your GROQ_API_KEY in .env file");
      console.error("   Get a valid key from: https://console.groq.com");
    } else if (error.status === 429) {
      console.error("   Rate limit exceeded. Please wait a moment and try again.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("   Network error. Please check your internet connection.");
    } else {
      console.error(`   ${error.message}`);
    }
    
    process.exit(1);
  }
}

testGroq();
