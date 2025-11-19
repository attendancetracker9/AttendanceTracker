# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Admin Portal application.

## Prerequisites

- Firebase project created (see `FIREBASE_SETUP.md`)
- Firebase configuration added to `.env` file

## Step 1: Enable Authentication Methods in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable the following sign-in providers:

### Email/Password Authentication
1. Click on **Email/Password**
2. Toggle **Enable** to ON
3. Click **Save**

### Google Sign-In
1. Click on **Google**
2. Toggle **Enable** to ON
3. Enter your **Project support email**
4. Click **Save**

### Phone Authentication
1. Click on **Phone**
2. Toggle **Enable** to ON
3. Click **Save**
4. Note: Phone authentication requires reCAPTCHA verification (handled automatically)

## Step 2: Set Up Access Codes Collection (for Admin Users)

Access codes are used to identify different colleges. You need to create a Firestore collection to store them.

1. Go to **Firestore Database** in Firebase Console
2. Create a collection named `accessCodes`
3. Add documents with the following structure:

**Document ID**: `COLLEGE001` (or your college code)
```json
{
  "active": true,
  "collegeName": "Your College Name",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Example documents:**
- `COLLEGE001` - Active college
- `COLLEGE002` - Another college
- `COLLEGE003` - Third college

## Step 3: Set Up Users Collection Structure

The app automatically creates user profiles in Firestore. The structure is:

**Collection**: `users`
**Document ID**: Firebase User UID

**Document structure:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin" | "others",
  "accessCode": "COLLEGE001",  // Only for admin users
  "collegeId": "COLLEGE001",    // Only for admin users
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Step 4: Firestore Security Rules

Add these security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Access codes are read-only for authenticated users
    match /accessCodes/{codeId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins can write (set up Cloud Functions for this)
    }
    
    // Other collections (students, announcements, etc.)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: Create Test Users

### Option 1: Create via Firebase Console
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Add user**

### Option 2: Create via App Registration
Users can register through the login page. The app will automatically create their profile in Firestore.

## Step 6: Test Authentication

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Test the following:

### Email/Password Login
- **Admin**: Enter email, password, select "Admin", enter access code (e.g., `COLLEGE001`)
- **Others**: Enter email, password, select "Others"

### Google Sign-In
- Click the "Google" button
- Sign in with your Google account
- User profile will be created automatically

### Phone Authentication
- Switch to "OTP" tab
- Enter phone number (10 digits)
- Click "Send OTP"
- Enter the OTP received via SMS
- Sign in

## Troubleshooting

### "Invalid access code" error
- Ensure the access code exists in the `accessCodes` collection
- Check that `active` field is set to `true`
- Verify the code is typed correctly (case-insensitive)

### Phone authentication not working
- Ensure Phone authentication is enabled in Firebase Console
- Check that reCAPTCHA is properly initialized
- Verify phone number format (should be 10 digits for India)

### Google Sign-In popup blocked
- Check browser popup settings
- Ensure Firebase project has Google sign-in enabled
- Verify OAuth consent screen is configured

### User profile not created
- Check Firestore security rules
- Verify user has write permissions
- Check browser console for errors

## Production Considerations

1. **Access Code Management**: Set up Cloud Functions to manage access codes securely
2. **User Roles**: Implement role-based access control (RBAC) in security rules
3. **Email Verification**: Enable email verification for production
4. **Rate Limiting**: Configure rate limits for authentication attempts
5. **Audit Logging**: Set up logging for authentication events

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)

