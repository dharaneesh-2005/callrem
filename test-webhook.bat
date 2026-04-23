@echo off
echo Testing webhook endpoint...
echo.

curl -X POST https://feerem.dhans.online/api/voice/webhook -H "Content-Type: application/x-www-form-urlencoded" -d "CallSid=test123&From=+917548871552&To=+18168399689"

echo.
echo.
echo If you see XML response above, webhook is working!
echo If you see error, check:
echo   1. Is Cloudflare tunnel running?
echo   2. Is your app running on port 5000?
echo   3. Is feerem.dhans.online pointing to your tunnel?
echo.
pause
