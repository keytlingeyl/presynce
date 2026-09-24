// =====================================================
// FIREBASE CONFIGURATION (Spark Plan)
// =====================================================
// ACTION REQUIRED: Replace the placeholder values below with YOUR Firebase
// project's config. Get this from:
//   Firebase Console -> Project Settings (gear icon) -> General tab
//   -> "Your apps" -> Web app -> SDK setup and configuration -> Config
//
// This file must be loaded AFTER the firebase-app-compat.js /
// firebase-auth-compat.js / firebase-firestore-compat.js CDN scripts,
// and BEFORE authManager.js / backupManager.js.
//
// Also required in the Firebase Console before this will work:
//   1. Authentication -> Sign-in method -> enable "Google" provider.
//   2. Authentication -> Settings -> Authorized domains -> add your
//      Vercel deployment domain (and localhost, already included by default).
//   3. Firestore Database -> Create database (production mode) and paste
//      the security rules from README_FIREBASE_SETUP.md.
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyAh9qrHK8Sjnqr-hqMLGT0OI5Vs9nDmAzI",
  authDomain: "presynce-attendance-tracker.firebaseapp.com",
  projectId: "presynce-attendance-tracker",
  storageBucket: "presynce-attendance-tracker.firebasestorage.app",
  messagingSenderId: "473424634894",
  appId: "1:473424634894:web:839e47ea0b961b18fbc85f",
};

const FIREBASE_CONFIG_IS_PLACEHOLDER = firebaseConfig.apiKey === "YOUR_API_KEY";

if (typeof firebase !== "undefined" && !FIREBASE_CONFIG_IS_PLACEHOLDER) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} else if (typeof firebase !== "undefined") {
  console.warn("[Presynce] firebaseConfig.js still has placeholder values. Fill in your real Firebase project config to enable Google Sign-In and Cloud Backup.");
}

const firebaseAuth = typeof firebase !== "undefined" && !FIREBASE_CONFIG_IS_PLACEHOLDER ? firebase.auth() : null;
const firebaseDb = typeof firebase !== "undefined" && !FIREBASE_CONFIG_IS_PLACEHOLDER ? firebase.firestore() : null;
const googleAuthProvider = typeof firebase !== "undefined" && !FIREBASE_CONFIG_IS_PLACEHOLDER ? new firebase.auth.GoogleAuthProvider() : null;

if (firebaseAuth) {
  firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
    console.warn("Firebase Auth persistence setup failed:", err);
  });
}
