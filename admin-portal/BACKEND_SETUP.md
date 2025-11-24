# Backend Server Setup for Fast2SMS

## Problem
Fast2SMS API doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. This is a security feature that prevents websites from making unauthorized API calls.

## Solution
We need a backend server to proxy requests to Fast2SMS API. This server will:
1. Receive requests from your frontend
2. Forward them to Fast2SMS API with proper headers
3. Return the response to your frontend

---

## Option 1: Simple Node.js Backend Server (Recommended for Development)

### Step 1: Install Dependencies

Navigate to the `admin-portal` directory and install the required packages:

```bash
cd admin-portal
npm install express cors
```

### Step 2: Create Backend Server

A file `backend-server.js` has already been created for you in the `admin-portal` directory.

### Step 3: Start the Backend Server

Open a **new terminal window** and run:

```bash
cd admin-portal
node backend-server.js
```

You should see:
```
🚀 Fast2SMS Proxy Server running on http://localhost:3001
📡 Ready to proxy requests to Fast2SMS API
```

### Step 4: Update Frontend to Use Backend

The frontend code has been updated to use the proxy in development. Make sure your Vite dev server is running on port 5173.

### Step 5: Test

1. Make sure both servers are running:
   - Frontend: `npm run dev` (port 5173)
   - Backend: `node backend-server.js` (port 3001)

2. Try sending an announcement from your app.

---

## Option 2: Firebase Cloud Functions (Recommended for Production)

For production deployment, you should use Firebase Cloud Functions instead of a separate Node.js server.

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase Functions

```bash
cd admin-portal
firebase init functions
```

Select:
- TypeScript
- ESLint (optional)
- Install dependencies: Yes

### Step 3: Create Cloud Function

Create/edit `functions/src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/fast2sms", async (req, res) => {
  try {
    const { message, numbers, route } = req.body;
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"];

    if (!apiKey) {
      return res.status(400).json({
        return: false,
        message: ["API key is required"]
      });
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey as string,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message.trim(),
        numbers: numbers,
        route: route || "q"
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({
      return: false,
      message: [error.message || "Internal server error"]
    });
  }
});

export const fast2sms = functions.https.onRequest(app);
```

### Step 4: Deploy Function

```bash
firebase deploy --only functions
```

### Step 5: Update Frontend

Update `fast2smsService.ts` to use your Cloud Function URL:

```typescript
const url = "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/fast2sms";
```

---

## Option 3: Vite Proxy (Development Only)

For development, you can use Vite's built-in proxy feature. This has been configured in `vite.config.ts`, but it may not work perfectly due to Fast2SMS server restrictions.

**Note:** This only works in development mode. For production, you MUST use Option 1 or Option 2.

---

## Troubleshooting

### Error: "Cannot find module 'express'"
- Run `npm install express cors` in the admin-portal directory

### Error: "Port 3001 already in use"
- Change the PORT in `backend-server.js` or stop the process using port 3001

### CORS errors still appearing
- Make sure the backend server is running
- Check that the frontend is using the proxy URL (`/api/fast2sms`)
- Verify the backend server is accessible at `http://localhost:3001`

### Fast2SMS API errors
- Verify your API key is correct in Settings
- Check Fast2SMS account balance
- Ensure phone numbers are in correct format (10 digits)

---

## Production Deployment Checklist

- [ ] Set up backend server or Cloud Functions
- [ ] Update frontend to use production API endpoint
- [ ] Secure API keys (use environment variables)
- [ ] Test SMS sending functionality
- [ ] Monitor error logs
- [ ] Set up rate limiting if needed

---

## Security Notes

⚠️ **Important:** Never expose your Fast2SMS API key in frontend code or public repositories. Always use:
- Environment variables for API keys
- Backend server to handle API calls
- Secure storage for sensitive credentials

---

## Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify both servers are running
3. Test the backend server directly with Postman/curl
4. Check Fast2SMS API documentation for any changes

