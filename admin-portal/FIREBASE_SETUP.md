# Firebase Setup Guide

This application uses Firebase for data storage (Firestore), file storage, and authentication.

## Prerequisites

1. A Firebase account (sign up at https://firebase.google.com)
2. A Firebase project created

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Firestore Database

1. In your Firebase project, go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (or Test mode for development)
4. Select a location for your database
5. Click "Enable"

### 3. Enable Firebase Storage

1. In your Firebase project, go to **Storage**
2. Click "Get started"
3. Accept the security rules (you can customize later)
4. Select a location (same as Firestore is recommended)
5. Click "Done"

### 4. Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Admin Portal")
5. Copy the Firebase configuration object

### 5. Configure Environment Variables

1. Copy `.env.example` to `.env` in the `admin-portal` directory:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyCqYMkewslsU9VKwnZpWIZ9kCmIyREAhKs
   VITE_FIREBASE_AUTH_DOMAIN=http://attendence-tracker-946cc.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=attendence-tracker-946cc
   VITE_FIREBASE_STORAGE_BUCKET=http://attendence-tracker-946cc.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=92072367902
   VITE_FIREBASE_APP_ID=1:592072367902:web:c4e5cf13b83a1b7e92f30f
   ```

### 6. Set Up Firestore Security Rules

Go to **Firestore Database** → **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students collection
    match /students/{studentId} {
      allow read, write: if request.auth != null;
    }
    
    // Announcements collection
    match /announcements/{announcementId} {
      allow read, write: if request.auth != null;
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
    
    // Templates collection
    match /templates/{templateId} {
      allow read, write: if request.auth != null;
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** For development, you can use:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Allow all for development
    }
  }
}
```

### 7. Set Up Storage Security Rules

Go to **Storage** → **Rules** and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** For development, you can use:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Allow all for development
    }
  }
}
```

### 8. Initialize Collections (Optional)

The app will create collections automatically when you first use them. However, you can pre-create them:

1. Go to **Firestore Database**
2. Click "Start collection"
3. Create these collections:
   - `students`
   - `announcements`
   - `notifications`
   - `templates`
   - `settings`

### 9. Seed Initial Templates (Optional)

You can add initial message templates to the `templates` collection:

1. Go to **Firestore Database** → `templates` collection
2. Add documents with these IDs:
   - `attendance_entry`
   - `attendance_exit`
   - `exam_alert`
   - `daily_digest`
   - `student_progress`

Each document should have:
- `name`: Template name
- `description`: Template description
- `content`: Template content with `{{1}}`, `{{2}}`, etc. placeholders
- `variables`: Array of variable names (e.g., `["1", "2", "3"]`)
- `lastUpdated`: Timestamp

### 10. Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Check the browser console for any Firebase errors
4. Try uploading a roster file to test Firestore connection

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Go to **Authentication** → **Settings** → **Authorized domains**
- Add your domain (e.g., `localhost` for development)

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Ensure rules allow read/write operations

### "Firebase App named '[DEFAULT]' already exists"
- This is normal if Firebase is initialized multiple times
- The app handles this gracefully

### Data not loading
- Check browser console for errors
- Verify your `.env` file has correct values
- Ensure Firestore is enabled in your Firebase project
- Check Firestore security rules allow access

## Production Deployment

Before deploying to production:

1. Update Firestore security rules to be more restrictive
2. Update Storage security rules
3. Enable Firebase Authentication if needed
4. Set up proper CORS rules
5. Configure custom domain in Firebase Hosting (if using)

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)

