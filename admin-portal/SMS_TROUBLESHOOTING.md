# SMS Send Failures - Troubleshooting Guide

## Why SMS Messages Are Failing

### Common Reasons:

1. **Backend Server Not Running**
   - The backend proxy server must be running for SMS to work
   - Check: Is `npm run backend` running on port 3001?

2. **Invalid API Key**
   - Fast2SMS API key might be incorrect or expired
   - Check: Go to Settings → SMS Provider → Verify API Key

3. **Insufficient Balance**
   - Fast2SMS account might have no credits
   - Check: Log into your Fast2SMS dashboard

4. **Invalid Phone Numbers**
   - Phone numbers must be exactly 10 digits (Indian format)
   - Numbers with +91, spaces, or other formats are cleaned automatically
   - If cleaning fails, the number is skipped

5. **Rate Limiting**
   - Fast2SMS has rate limits (varies by plan)
   - Too many requests too quickly can cause failures

6. **Network/Backend Issues**
   - Backend server might not be accessible
   - Fast2SMS API might be temporarily down

---

## Why New Dataset Uploads Show in Notifications

### Important: Uploads DON'T Automatically Send Messages!

When you upload a new dataset (roster), it **only adds students to the database**. It does NOT send any SMS messages.

### Why You See New Students in Failed Notifications:

When you click **"Quick Send"** button:
- It sends to **ALL students** in your database (if "All students" is selected)
- This includes:
  - Old students (from previous uploads)
  - New students (from recent uploads)
  - All students currently in Firebase

So if you:
1. Upload Dataset A (100 students) → No messages sent
2. Upload Dataset B (50 more students) → No messages sent
3. Click "Quick Send" → Sends to ALL 150 students

The notifications you see are from when you clicked "Quick Send", not from the upload itself.

---

## How to Fix SMS Failures

### Step 1: Verify Backend Server is Running

Open a terminal and check:
```bash
# Should show the backend server running
npm run backend
```

You should see:
```
🚀 Fast2SMS Proxy Server running on http://localhost:3001
```

### Step 2: Check Your Fast2SMS API Key

1. Go to **Settings** in your app
2. Check **SMS Provider** section
3. Verify your **API Key** is correct
4. Make sure it's saved

### Step 3: Test Backend Connection

Run the test script:
```bash
node test-backend.js
```

Should show: `✅ Backend server is working correctly!`

### Step 4: Check Fast2SMS Account

1. Log into your Fast2SMS dashboard
2. Check account balance
3. Verify API key is active
4. Check for any account restrictions

### Step 5: Verify Phone Numbers

Phone numbers in your dataset should be:
- Exactly 10 digits
- Indian format (no country code)
- Example: `9876543210` ✅
- NOT: `+919876543210` or `91-9876543210`

The system automatically cleans numbers, but invalid formats might still fail.

### Step 6: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages when sending
4. Check **Network** tab for failed requests

---

## Understanding the Notification Status

- **"sent"** = SMS was successfully sent to Fast2SMS
- **"failed"** = SMS send failed (check error message)
- **"delivered"** = SMS was delivered to recipient (requires webhook setup)
- **"queued"** = SMS is waiting to be sent

---

## Common Error Messages

### "SMS API key not configured"
→ Go to Settings and add your Fast2SMS API key

### "Backend server is NOT running"
→ Start backend: `npm run backend`

### "No valid phone numbers found"
→ Check your dataset - phone numbers must be 10 digits

### "Failed to send SMS: Invalid Authentication"
→ Your Fast2SMS API key is incorrect or expired

### "Failed to send SMS: Insufficient balance"
→ Add credits to your Fast2SMS account

---

## Preventing Unwanted Sends

### To Avoid Sending to All Students:

1. **Use Target Filters**:
   - Instead of "All students", use:
     - "Class" - Select specific classes
     - "Section" - Select specific sections
     - "Custom" - Enter specific phone numbers

2. **Check Before Sending**:
   - Review the number of recipients shown
   - Make sure you want to send to all of them

3. **Test with Small Group First**:
   - Use "Custom" target
   - Enter 1-2 test phone numbers
   - Verify it works before sending to all

---

## Need More Help?

1. **Check Backend Logs**: Look at the terminal where `npm run backend` is running
2. **Check Browser Console**: F12 → Console tab
3. **Test API Key**: Use Fast2SMS dashboard to test your API key directly
4. **Verify Phone Numbers**: Make sure all numbers are valid 10-digit Indian numbers

