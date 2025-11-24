# Quick Start Guide - Fix CORS Error

## The Problem
Fast2SMS API blocks direct browser requests due to CORS security. You need a backend server to proxy the requests.

## Quick Solution (5 minutes)

### Step 1: Install Backend Dependencies

Open terminal in the `admin-portal` folder and run:

```bash
npm install express cors
```

### Step 2: Start the Backend Server

Open a **NEW terminal window** (keep your frontend running) and run:

```bash
cd admin-portal
npm run backend
```

You should see:
```
🚀 Fast2SMS Proxy Server running on http://localhost:3001
📡 Ready to proxy requests to Fast2SMS API
```

### Step 3: Keep Both Servers Running

You need **TWO terminal windows**:

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
npm run backend
```

### Step 4: Test

1. Make sure your Fast2SMS API key is saved in Settings
2. Go to Announcements page
3. Fill in title and message
4. Click "Quick Send"
5. Messages should now send successfully! ✅

---

## Alternative: Run Both Servers Together

If you want to run both servers with one command, install `concurrently`:

```bash
npm install --save-dev concurrently
```

Then run:
```bash
npm run dev:all
```

This will start both frontend and backend servers together.

---

## Troubleshooting

### "Cannot find module 'express'"
→ Run `npm install express cors` in the admin-portal directory

### "Port 3001 already in use"
→ Close the application using port 3001, or change the port in `backend-server.js`

### Still getting CORS errors?
→ Make sure the backend server is running on port 3001
→ Check browser console for the exact error
→ Verify both servers are running

### Messages not sending?
→ Check your Fast2SMS API key in Settings
→ Verify phone numbers are in correct format (10 digits)
→ Check Fast2SMS account balance

---

## For Production

For production deployment, you'll need to:
1. Deploy the backend server to a hosting service (Heroku, Railway, etc.)
2. Update the `VITE_BACKEND_URL` environment variable
3. Or use Firebase Cloud Functions (see BACKEND_SETUP.md)

---

## Need More Help?

See `BACKEND_SETUP.md` for detailed instructions and production deployment options.

