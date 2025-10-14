
require('dotenv').config();

const { admin, db } = require('../enviroment/firebase/firebase');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { validateUser, collectionPath } = require('../models/userModel');

async function registerUser(data) {
    const { email, password, displayName } = data;

    // Ensure displayName is unique
    const displayNameSnapshot = await db
        .collection(collectionPath)
        .where('displayName', '==', displayName)
        .limit(1)
        .get();

    if (!displayName || displayNameSnapshot.size > 0) {
        throw new Error('Display name is already taken or missing.');
    }

    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
        });

        delete data.password;

        await createUserInDatabase(userRecord.uid, data);

        return { id: userRecord.uid, email };
    } catch (err) {
        console.error('Firebase createUser failed:', err);
        throw err;
    }
}

async function createUserInDatabase(uid, data) {
    console.log('Creating user in database:', uid, data);

    const validData = validateUser(data);

    await db.collection(collectionPath).doc(uid).set(validData);

    return { id: uid, ...validData };
}


async function loginUser({ email, password }) {
    let login_URL;
    let apiKey;
    const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000;
    apiKey = process.env.FIREBASE_API_KEY;
    login_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    try {
        console.log('loging in user:', email, password);
        const resp = await axios.post(
            login_URL,
            { email, password, returnSecureToken: true },
            { headers: { 'Content-Type': 'application/json' } }
        );


        const { idToken, localId: uid } = resp.data;


        const sessionCookie = await admin
            .auth()
            .createSessionCookie(idToken, { expiresIn: FIVE_DAYS_IN_MS });

        return { sessionCookie, idToken };
    } catch (err) {
        if (err.response?.data?.error) {
            const { message, code } = err.response.data.error;
            console.error('Firebase login error code=', code, 'message=', message);

            switch (message) {
                case 'EMAIL_NOT_FOUND':
                    throw new Error('No account found for that email.');
                case 'INVALID_PASSWORD':
                    throw new Error('Incorrect password.');
                case 'USER_DISABLED':
                    throw new Error('This user account has been disabled.');
                default:
                    throw new Error(`Authentication failed: ${message}`);
            }
        }

        console.error('Unexpected sign-in error:', err);
        throw new Error('Unable to sign in user at this time.');
    }
}


async function logoutUser(req) {
    // Accept sessionCookie from Authorization header or request body
    const authHeader = req.headers.authorization || '';
    let token = null;
    let tokenType = null;

    // Try to get sessionCookie from Authorization header
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
        tokenType = 'sessionCookie';
    }
    // If not in header, try to get from body
    if (!token && req.body) {
        if (req.body.sessionCookie) {
            token = req.body.sessionCookie;
            tokenType = 'sessionCookie';
        }
    }

    if (!token) {
        throw new Error('Missing session cookie');
    }

    let decoded;
    try {
        // Only verify as sessionCookie
        decoded = await admin.auth().verifySessionCookie(token, true);
        tokenType = 'sessionCookie';
    } catch (err) {
        throw new Error('Invalid session cookie');
    }

    // Invalidate sessionCookie by revoking refresh tokens for the UID
    await admin.auth().revokeRefreshTokens(decoded.uid);

    return decoded.uid;
}

async function deleteUser(req) {
    const authHeader = req.headers.authorization || '';
    let token = null;
    let tokenType = null;

    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
        tokenType = 'sessionCookie';
    }

    const decoded = await admin
        .auth()
        .verifySessionCookie(token, true);

    try {
        await admin.auth().deleteUser(decoded.uid);
        await deleteUserFromDatabase(decoded.uid);
        console.log('Successfully deleted user:', decoded.uid);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

async function deleteUserFromDatabase(uid) {
    try {
        // Delete all encounters in the user's subcollection
        const encountersRef = db.collection(collectionPath).doc(uid).collection('encounters');
        const snapshot = await encountersRef.get();
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the user document itself
        await db.collection(collectionPath).doc(uid).delete();
        console.log('Successfully deleted user and all encounters from database:', uid);
    } catch (error) {
        console.error('Error deleting user from database:', error);
        throw error;
    }
}

/**
 * Get a user's public and private info by UID
 */
async function getUserInfoById(uid) {
    const userDoc = await db.collection(collectionPath).doc(uid).get();
    if (!userDoc.exists) throw new Error('User not found');
    const user = userDoc.data();
    // Return all user info except tokens
    const { tokens, ...rest } = user;
    return { id: uid, ...rest };
}

/**
 * Get a user's public info by email
 */
async function getUserPublicInfoByEmail(email) {
    const snapshot = await db.collection(collectionPath).where('email', '==', email).limit(1).get();
    if (snapshot.empty) throw new Error('User not found');
    const doc = snapshot.docs[0];
    const user = doc.data();
    // Only return public fields
    const { firstName, lastName, fullName, email: userEmail } = user;
    return { id: doc.id, firstName, lastName, fullName, email: userEmail };
}

async function updateUserInfo(uid, userData) {
    const userRef = db.collection(collectionPath).doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error('User not found');
    // Validate userData before updating
    const prevData = userSnap.data();

    // If displayName is being updated, ensure it's unique
    if (
        userData.displayName &&
        userData.displayName !== prevData.displayName
    ) {
        const displayNameSnapshot = await db
            .collection(collectionPath)
            .where('displayName', '==', userData.displayName)
            .limit(1)
            .get();

        // If another user already has this displayName, throw error
        if (
            !displayNameSnapshot.empty &&
            displayNameSnapshot.docs[0].id !== uid
        ) {
            throw new Error('Display name is already taken or missing.');
        }
    }

    const validData = validateUser({ ...prevData, ...userData });

    // If email is being updated, update in Firebase Auth as well
    if (userData.email && userData.email !== prevData.email) {
        await admin.auth().updateUser(uid, { email: userData.email });
    }

    await userRef.update(validData);
    return { id: uid, ...validData };
}

const fetch = require('node-fetch');

async function googleUserAuth(accessToken) {
    try {
        const googleUserInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!googleUserInfo.ok) {
            throw new Error('Failed to fetch user info from Google');
        }

        const userDataFromGoogle = await googleUserInfo.json();

        console.log('Google user data:', userDataFromGoogle);
        const {
            sub: googleId,
            email,
            name: fullName,
            given_name: firstName,
            family_name: lastName,
            picture: profilePicture,
            email_verified: emailVerified
        } = userDataFromGoogle;

        let userRecord;
        let isNewUser = false;

        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                userRecord = await admin.auth().createUser({
                    uid: googleId,
                    email,
                    displayName: fullName,
                    photoURL: profilePicture,
                    emailVerified: emailVerified,
                });
                isNewUser = true;
            } else {
                throw error;
            }
        }

        const userDoc = await db.collection(collectionPath).doc(userRecord.uid).get();

        if (!userDoc.exists) {
            const userData = {
                email,
                firstName: firstName || '',
                lastName: lastName || '',
                fullName: fullName || email.split('@')[0],
                displayName: fullName || email.split('@')[0],
                profilePicture: profilePicture || '',
                bio: '',
                isPrivate: false,
                created: new Date(),
                updated: new Date()
            };

            const displayNameSnapshot = await db
                .collection(collectionPath)
                .where('displayName', '==', userData.displayName)
                .limit(1)
                .get();

            if (displayNameSnapshot.size > 0) {
                let counter = 1;
                let baseDisplayName = userData.displayName;
                let uniqueDisplayName = `${baseDisplayName}${counter}`;
                
                while (true) {
                    const checkSnapshot = await db
                        .collection(collectionPath)
                        .where('displayName', '==', uniqueDisplayName)
                        .limit(1)
                        .get();

                    if (checkSnapshot.empty) {
                        userData.displayName = uniqueDisplayName;
                        break;
                    }
                    counter++;
                    uniqueDisplayName = `${baseDisplayName}${counter}`;

                    if (counter > 1000) {
                        userData.displayName = `${baseDisplayName}${Date.now()}`;
                        break;
                    }
                }
            }
            

            const validData = validateUser(userData);
            console.log('Creating new user in database:', validData);
            await db.collection(collectionPath).doc(userRecord.uid).set(validData);
        }

        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        const signInResult = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        });

        if (!signInResult.ok) {
            throw new Error('Failed to exchange custom token for ID token');
        }

        const signInData = await signInResult.json();
        const idToken = signInData.idToken;

        const sessionCookie = await admin.auth().createSessionCookie(idToken, {
            expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 days
        });

        return {
            uid: userRecord.uid,
            email: userRecord.email,
            sessionCookie,
            isNewUser,
        };

    } catch (error) {
        console.error('Error in verifyAndCreateGoogleUser:', error);
        throw error;
    }
}



module.exports = { registerUser, loginUser, logoutUser, deleteUser, getUserInfoById, getUserPublicInfoByEmail, updateUserInfo, googleUserAuth};