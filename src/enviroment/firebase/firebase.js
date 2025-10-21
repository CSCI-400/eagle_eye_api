require("dotenv").config({ path: '.env' });
const admin = require('firebase-admin');

const serviceAccount = require('./eagleeye-e31ac-firebase-adminsdk-fbsvc-577e87426d.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
     storageBucket: 'eagleeye-e31ac.firebasestorage.app',
});

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
        if (error.code === 404) {
            console.warn('Bucket not found. Make sure Cloud Storage is enabled in Firebase Console.');
        }
        return false;
    }
}

module.exports = { admin, db, isStorageAvailable };

