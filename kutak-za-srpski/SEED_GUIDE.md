# Database Seeding Guide

Your Firestore database is empty. Follow these steps to populate it with initial data (classes, terms, and blog posts).

## Step 1: Get Your Firebase Admin SDK Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kutak-za-srpski**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click the blue **Generate New Private Key** button
6. A JSON file will download automatically

## Step 2: Add the Key to Your Project

1. Rename the downloaded file to `.firebase-key.json`
2. Place it in the **root** of your project (same level as `package.json`)
   ```
   kutak-za-srpski/
   ├── .firebase-key.json  ← Put it here
   ├── package.json
   ├── next.config.ts
   └── ...
   ```

⚠️ **Important**: This file is already in `.gitignore` and should NEVER be committed to version control.

## Step 3: Run the Seed Script

```bash
npm run seed
```

You should see output like:
```
🌱 Starting database seed...

Adding classes...
✓ Added 3 classes

Adding terms...
✓ Added 3 terms

Adding blog posts...
✓ Added 2 blog posts

✅ Database seed complete!
```

## Step 4: Verify in Firebase Console

Go back to [Firebase Console](https://console.firebase.google.com/) and navigate to the **Data** tab. You should now see:
- ✅ `classes` collection with 3 documents
- ✅ `terms` collection with 3 documents
- ✅ `blogPosts` collection with 2 documents

## Troubleshooting

**Error: "Could not load Firebase service account"**
- Make sure the `.firebase-key.json` file is in the root directory
- Verify the file is named exactly `.firebase-key.json`

**Error: "Permission denied"**
- Check that your Firebase Firestore security rules allow writes from your Admin SDK
- Default rules should allow Admin SDK access

**Nothing appears after running seed**
- Refresh your Firebase Console page
- Make sure you're looking at the correct project (kutak-za-srpski)

---

After seeding, your website will display the sample programs, terms, and blog posts, and the admin dashboard will become fully functional.
