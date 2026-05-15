# ⚠️ IMPORTANT: Enable Firestore Database

Your app won't sync across devices until you enable Firestore. Follow these exact steps:

## Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Click on your project: **to-do-task-543f0**

## Step 2: Enable Firestore Database
1. In the left sidebar, click **Build** → **Firestore Database**
2. Click the **"Create database"** button
3. Choose **"Start in test mode"** (important!)
4. Click **Next**
5. Select a location (choose closest to you, e.g., us-central)
6. Click **Enable**
7. Wait for it to finish (takes 1-2 minutes)

## Step 3: Verify Security Rules
After database is created, click on the **"Rules"** tab and make sure it looks like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

If it's different, copy the above and click **"Publish"**

## Step 4: Test Your App
1. Open your app in browser
2. Press F12 to open Developer Console
3. Add a task
4. Look for green checkmarks (✅) in console
5. Open the same URL on another device - tasks should sync!

## Troubleshooting

### If you see "permission-denied" error:
- Go to Firestore → Rules tab
- Make sure rules allow `read, write: if true`
- Click Publish

### If you see "failed-precondition" error:
- Firestore is not enabled yet
- Follow Step 2 above

### If tasks still don't sync:
- Check browser console (F12) for errors
- Make sure both devices are using the SAME deployed URL
- Clear browser cache and reload

## Security Note
The current rules (`allow read, write: if true`) are for testing only. 
For production, you should add proper authentication and security rules.
