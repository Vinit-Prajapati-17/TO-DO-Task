# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "todo-task-app")
4. Follow the setup wizard (you can disable Google Analytics if you want)

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Give your app a nickname (e.g., "Todo App")
3. Click "Register app"
4. Copy the Firebase configuration object

## Step 3: Enable Firestore Database

1. In the Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
   - This allows read/write access for 30 days
   - For production, you'll need to set up proper security rules
4. Select a Cloud Firestore location (choose closest to your users)
5. Click "Enable"

## Step 4: Configure Your App

1. Open `src/firebase.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Run Your App

```bash
npm install
npm run dev
```

## Security Rules (For Production)

After testing, update your Firestore security rules:

1. Go to **Firestore Database** → **Rules**
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if true; // Change this based on your auth requirements
    }
  }
}
```

## Features

✅ Real-time sync across all devices
✅ Tasks automatically update for all users
✅ No manual refresh needed
✅ Works offline (Firebase handles sync when back online)

## Troubleshooting

- **"Failed to add task"**: Check your Firebase config in `src/firebase.js`
- **No tasks showing**: Make sure Firestore is enabled and rules allow read/write
- **Console errors**: Check browser console for specific Firebase errors
