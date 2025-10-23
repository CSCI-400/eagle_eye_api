
require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin.
// Prefer reading a service account JSON from the FIREBASE_SERVICE_ACCOUNT env var (Secret Manager string).
// If not provided, fall back to Application Default Credentials (recommended on GCP).
let initialized = false;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let serviceAccountObj = null;
        try {
            serviceAccountObj = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.warn('FIREBASE_SERVICE_ACCOUNT exists but failed to parse as JSON.');
            throw e;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountObj),
            storageBucket: 'eagleeye-e31ac.firebasestorage.app',
        });
        initialized = true;
    }
} catch (err) {
    console.error('Error initializing Firebase from FIREBASE_SERVICE_ACCOUNT:', err.message || err);
}

if (!initialized) {
    // Use application default credentials when running on GCP (Cloud Run / Firebase Hosting backend)
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: 'eagleeye-e31ac.firebasestorage.app',
    });
}

const db = admin.firestore();

// Function to check if storage bucket is available
async function isStorageAvailable() {
    try {
        const bucket = admin.storage().bucket();
        const [exists] = await bucket.exists();
        if (!exists) {
            console.warn('Storage bucket does not exist');
            return false;
        }
        return true;
    } catch (error) {
        console.warn('Storage bucket not available:', error.message);
        // Log more details for debugging
        if (error && error.code === 404) {
            console.warn('Bucket not found. Make sure Cloud Storage is enabled in Firebase Console.');
        }
        return false;
    }
}

module.exports = { admin, db, isStorageAvailable };

