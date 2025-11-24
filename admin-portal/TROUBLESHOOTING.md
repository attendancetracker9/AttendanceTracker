# Troubleshooting Guide

## Issue: 404 Error When Starting Backend

### Symptoms
- Console shows: "Failed to load resource: the server responded with a status of 404 (Not Found)"
- Chrome DevTools warning about `.well-known/appspecific/com.chrome.devtools.json` (this can be ignored)

### Solution Steps

#### Step 1: Verify Backend Server is Running

Open a **NEW terminal window** and run:

```bash
cd admin-portal
npm run backend
```

You should see:
```
🚀 Fast2SMS Proxy Server running on http://localhost:3001
📡 Ready to proxy requests to Fast2SMS API
```

**If you see an error**, check:

1. **"Cannot find module 'express'"**
   ```bash
   npm install express cors
   ```

2. **"Port 3001 already in use"**
   - Find what's using port 3001:
     ```bash
     netstat -ano | findstr :3001
     ```
   - Or change the port in `backend-server.js` (line 67)

3. **"SyntaxError: Cannot use import statement outside a module"**
   - Make sure `package.json` has `"type": "module"` (it should already have this)

#### Step 2: Test Backend Server

In a new terminal, test if the server is responding:

```bash
cd admin-portal
node test-backend.js
```

You should see:
```
✅ Backend server is running! (API key validation working)
```

If you see:
```
❌ Backend server is NOT running!
```
→ Go back to Step 1 and start the server

#### Step 3: Verify Both Servers Are Running

You need **TWO terminal windows**:

**Terminal 1 (Frontend):**
```bash
cd admin-portal
npm run dev
```
Should show: `Local: http://localhost:5173/`

**Terminal 2 (Backend):**
```bash
cd admin-portal
npm run backend
```
Should show: `🚀 Fast2SMS Proxy Server running on http://localhost:3001`

#### Step 4: Test in Browser

1. Open your app: http://localhost:5173
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try sending an announcement
5. Look for requests to `http://localhost:3001/api/fast2sms`

**If you see:**
- ✅ Status 200 or 400 (with error message) = Backend is working!
- ❌ Status 404 = Backend server not running
- ❌ CORS error = Backend CORS not configured correctly

---

## Common Issues

### Issue 1: Backend Server Crashes Immediately

**Error:** Server starts then immediately closes

**Solution:**
- Check Node.js version: `node --version` (should be 18+)
- Check for syntax errors in `backend-server.js`
- Make sure `express` and `cors` are installed

### Issue 2: "ECONNREFUSED" Error

**Error:** `Failed to fetch` or `ECONNREFUSED`

**Solution:**
- Backend server is not running
- Start it with: `npm run backend`
- Verify it's running on port 3001

### Issue 3: CORS Errors Still Appearing

**Error:** CORS policy blocked

**Solution:**
1. Check `backend-server.js` has CORS enabled (line 15-18)
2. Verify frontend URL matches: `http://localhost:5173`
3. Restart backend server after changes

### Issue 4: Fast2SMS API Errors

**Error:** API returns error from Fast2SMS

**Solution:**
- Check your API key in Settings
- Verify phone numbers are 10 digits
- Check Fast2SMS account balance
- Verify API key is valid

---

## Quick Diagnostic Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Should return: {"status":"ok","service":"Fast2SMS Proxy"}

# Test backend endpoint
node test-backend.js

# Check what's using port 3001 (Windows)
netstat -ano | findstr :3001

# Check Node processes
Get-Process -Name node
```

---

## Still Having Issues?

1. **Check all error messages** in both terminal windows
2. **Verify both servers are running** (frontend on 5173, backend on 3001)
3. **Test backend directly** with `node test-backend.js`
4. **Check browser console** for specific error messages
5. **Restart both servers** (stop with Ctrl+C, then restart)

---

## Note About Chrome DevTools Warning

The warning about `.well-known/appspecific/com.chrome.devtools.json` is **harmless** and can be ignored. It's just Chrome trying to connect DevTools and doesn't affect your application.

