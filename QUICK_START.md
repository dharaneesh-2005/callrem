# Quick Start Guide

## 1. Get Groq API Key (2 minutes)

1. Go to https://console.groq.com
2. Sign up with Google/GitHub or email
3. Click "API Keys" in sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_...`)

## 2. Update Environment Variables

Open `.env` and replace:
```env
GROQ_API_KEY="your_valid_groq_api_key_here"
```

With your actual key:
```env
GROQ_API_KEY="gsk_abc123xyz..."
```

## 3. Start Cloudflare Tunnel (for testing)

In a new terminal:
```cmd
cloudflared.exe tunnel --url http://localhost:5000
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-name-1234.trycloudflare.com
```

## 4. Update PUBLIC_URL

Copy the tunnel URL and update `.env`:
```env
PUBLIC_URL=https://random-name-1234.trycloudflare.com
```

## 5. Start Your Application

In your main terminal:
```cmd
npm run dev
```

Wait for:
```
serving on port 5000
```

## 6. Test the System

### Test 1: Check webhook endpoint
Open browser: `https://your-tunnel-url.trycloudflare.com/api/voice/webhook`

You should see XML response.

### Test 2: Make a real call
1. Go to Twilio Console
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Click your number
4. Under "Voice Configuration":
   - A CALL COMES IN: Webhook
   - URL: `https://your-tunnel-url.trycloudflare.com/api/voice/webhook`
   - HTTP: POST
5. Save
6. Call your Twilio number from your phone!

## 7. Monitor Logs

Watch your terminal for:
```
Student lookup: { toNumber: '+917548871552', foundStudent: 'Dharaneesh S.k' }
Groq classification result: { intent: 'fee_inquiry', confidence: 0.95 }
```

## Troubleshooting

### "Invalid API Key"
- Double-check your Groq API key
- Make sure there are no extra spaces
- Restart the server after updating `.env`

### "Url is not a valid URL"
- Make sure Cloudflare tunnel is running
- Update PUBLIC_URL in `.env`
- Restart your application
- Update Twilio webhook URL

### "No student found"
- Check if student's phone number matches
- Phone numbers should include country code (+91 for India)
- Check database for student records

### Call connects but no response
- Check server logs for errors
- Verify Groq API key is valid
- Check network connectivity
- Review Twilio debugger console

## Expected Flow

1. **You call** → Twilio number
2. **Twilio calls** → Your webhook (via tunnel)
3. **Your server** → Looks up student, generates greeting
4. **Twilio speaks** → Personalized greeting
5. **You speak** → Your question
6. **Twilio transcribes** → Sends to your server
7. **Groq processes** → Classifies intent, generates response
8. **Twilio speaks** → AI response
9. **Repeat** → Until conversation ends

## Performance Expectations

- Initial greeting: ~500ms
- Response to questions: ~300-700ms
- Total call quality: Excellent (Twilio handles audio)

## Cost Expectations

- Groq: ~$0.00002 per call (negligible)
- Twilio: ~$0.01-0.02 per minute (standard rates)
- Database: Free tier sufficient for testing

## Next Steps

Once testing works:
1. Set up permanent Cloudflare tunnel (see CLOUDFLARE_TUNNEL_SETUP.md)
2. Configure custom domain (feerem.dhans.online)
3. Add more students to database
4. Customize greeting messages
5. Train AI with more context
6. Add analytics and reporting

## Support

If you encounter issues:
1. Check server logs
2. Check Twilio debugger console
3. Review GROQ_ARCHITECTURE.md
4. Test with curl commands
5. Verify all environment variables

## Success Checklist

- [ ] Groq API key obtained and added to `.env`
- [ ] Cloudflare tunnel running
- [ ] PUBLIC_URL updated in `.env`
- [ ] Application running on port 5000
- [ ] Twilio webhook URL updated
- [ ] Test call successful
- [ ] AI responds correctly
- [ ] Conversation flows naturally
- [ ] Logs show no errors

You're all set! 🎉
