const userService = require('../services/userService');
const { admin, isStorageAvailable } = require('../enviroment/firebase/firebase');
const { v4: uuidv4 } = require('uuid');

function errorResponse(res, status, message, code = null) {
    return res.status(status).json({
        error: {
            code: code || status,
            message,
        }
    });
}

function validateProfilePicture(file) {
    if (!file) {
        return;
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
        throw new Error('Profile picture must be an image file');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Profile picture must be less than 5MB');
    }
}

async function uploadProfilePicture(file, userId) {
    if (!file) {
        return null;
    }

    // Check if storage is available before attempting upload
    const storageAvailable = await isStorageAvailable();
    if (!storageAvailable) {
        console.warn('Storage bucket not available. Skipping profile picture upload.');
        return null;
    }

    try {
        const bucket = admin.storage().bucket(); // Use default bucket
        console.log('Using storage bucket:', bucket.name);

        // Use proper file extension based on mime type
        const fileExtension = file.mimetype.split('/')[1];
        const fileName = `users/${userId}/profilePicture.${fileExtension}`;

        const downloadToken = uuidv4();
        const profilePictureUrl = await new Promise((resolve, reject) => {
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            blobStream.on('error', reject);
            blobStream.on('finish', async () => {
                try {
                    // Create download URL using the token instead of making public
                    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;
                    resolve(downloadUrl);
                } catch (error) {
                    reject(error);
                }
            });
            blobStream.end(file.buffer);
        });

        return profilePictureUrl;
    } catch (storageError) {
        console.error('Error uploading profile picture:', storageError);
        if (storageError.response && storageError.response.data) {
            console.error('Storage error details:', JSON.stringify(storageError.response.data, null, 2));
        }
        console.warn('Storage bucket not configured or inaccessible. Skipping profile picture upload:', storageError.message);
        return null;
    }
}

async function registerUser(req, res) {
    try {
        console.log('Registering user:', req.body);

        // Get profile picture file if provided
        const profilePictureFile = req.files && req.files.profilePicture && req.files.profilePicture[0] 
            ? req.files.profilePicture[0] 
            : null;

        // Validate profile picture file early to fail fast
        if (profilePictureFile) {
            try {
                validateProfilePicture(profilePictureFile);
            } catch (validationError) {
                if (validationError.message === 'Profile picture must be an image file') {
                    return errorResponse(res, 400, 'Profile picture must be an image file', 'INVALID_FILE_TYPE');
                }
                if (validationError.message === 'Profile picture must be less than 5MB') {
                    return errorResponse(res, 400, 'Profile picture must be less than 5MB', 'FILE_TOO_LARGE');
                }
                // Re-throw other errors
                throw validationError;
            }
        }

        // Create user first
        const result = await userService.registerUser(req.body);

        try {
            // Upload profile picture if provided
            const profilePictureUrl = await uploadProfilePicture(profilePictureFile, result.id);
            
            // Update user with profile picture URL if upload was successful
            if (profilePictureUrl) {
                await userService.updateUserInfo(result.id, { profilePicture: profilePictureUrl });
            }

            res.status(201).json({
                id: result.id,
                email: result.email,
                profilePicture: profilePictureUrl
            });
        } catch (fileError) {
            // If file upload fails, log error but don't fail the registration
            console.error('Error uploading profile picture:', fileError);
            res.status(201).json({
                id: result.id,
                email: result.email,
                profilePicture: null,
                warning: 'User created but profile picture upload failed'
            });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        // 409 if email exists, 400 for validation, 500 otherwise
        if (error.code === 'auth/email-already-exists') {
            return errorResponse(res, 409, 'Email already exists', 'EMAIL_EXISTS');
        }
        if (error.name === 'ZodError') {
            return errorResponse(res, 400, 'Invalid user data', 'INVALID_DATA');
        }
        if (error.message === 'Display name is already taken or missing.') {
            return errorResponse(res, 400, 'Display name is already taken', 'DISPLAY_NAME_TAKEN');
        }
        return errorResponse(res, 500, 'Internal server error');
    }
}

async function loginUser(req, res) {
    try {
        const result = await userService.loginUser(req.body);
        res.cookie('__session', result.sessionCookie, {
            maxAge: 60 * 60 * 24 * 5 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });
        res.status(200).json({
            idToken: result.idToken,
            sessionCookie: result.sessionCookie,
        });
    } catch (error) {
        console.error('Error loging in user:', error);
        // 401 for auth errors, 400 for bad request, 500 otherwise
        if (error.message === 'No account found for that email.' || error.message === 'Incorrect password.' || error.message === 'This user account has been disabled.') {
            return errorResponse(res, 401, error.message, 'AUTH_FAILED');
        }
        if (error.message.startsWith('Authentication failed:')) {
            return errorResponse(res, 401, error.message, 'AUTH_FAILED');
        }
        return errorResponse(res, 500, 'Internal server error');
    }
}

async function logoutUser(req, res) {
    try {
        const result = await userService.logoutUser(req);
        res.clearCookie('__session');
        res.status(200).json({ message: 'Signed out successfully', uid: result });
    } catch (error) {
        console.error('Error loging out user:', error);
        if (error.message === 'Missing session cookie or id token') {
            return errorResponse(res, 401, 'Missing session cookie or id token', 'NO_SESSION');
        }
        // Handle invalid/expired session cookie or id token
        if (
            error.code === 'auth/argument-error' ||
            error.code === 'auth/invalid-session-cookie' ||
            error.code === 'auth/session-cookie-expired' ||
            error.code === 'auth/session-cookie-revoked' ||
            (typeof error.message === 'string' && (
                error.message.includes('expired') ||
                error.message.includes('invalid') ||
                error.message.includes('revoked')
            ))
        ) {
            return errorResponse(res, 401, 'Invalid or expired session cookie or id token', 'INVALID_SESSION');
        }
        return errorResponse(res, 500, 'Internal server error');
    }
}

async function deleteUser(req, res) {
    try {
        await userService.deleteUser(req);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.message === 'Missing session cookie') {
            return errorResponse(res, 401, 'Missing session cookie', 'NO_SESSION');
        }
        // Handle invalid/expired session cookie
        if (
            error.code === 'auth/argument-error' ||
            error.code === 'auth/invalid-session-cookie' ||
            error.code === 'auth/session-cookie-expired' ||
            error.code === 'auth/session-cookie-revoked' ||
            (typeof error.message === 'string' && (
                error.message.includes('expired') ||
                error.message.includes('invalid') ||
                error.message.includes('revoked')
            ))
        ) {
            return errorResponse(res, 401, 'Invalid or expired session cookie', 'INVALID_SESSION');
        }
        return errorResponse(res, 500, 'Internal server error');
    }
}

async function getMyUserInfo(req, res) {
    try {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) throw new Error('Missing or invalid token');
        const token = authHeader.split('Bearer ')[1];
        // Only verify as session cookie
        const decoded = await admin.auth().verifySessionCookie(token, true);
        const user = await userService.getUserInfoById(decoded.uid);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
        }
        return errorResponse(res, 401, error.message || 'Unauthorized', 'UNAUTHORIZED');
    }
}

async function getUserPublicInfoByEmail(req, res) {
    try {
        const { email } = req.params;
        const user = await userService.getUserPublicInfoByEmail(email);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
        }
        return errorResponse(res, 400, error.message || 'Bad request', 'BAD_REQUEST');
    }
}

async function updateUserInfo(req, res) {
    try {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) throw new Error('Missing or invalid token');
        const token = authHeader.split('Bearer ')[1];
        // Only verify as session cookie
        const decoded = await admin.auth().verifySessionCookie(token, true);
        
        // Get profile picture file if provided
        const profilePictureFile = req.files && req.files.profilePicture && req.files.profilePicture[0] 
            ? req.files.profilePicture[0] 
            : null;

        // Validate profile picture file early to fail fast
        if (profilePictureFile) {
            try {
                validateProfilePicture(profilePictureFile);
            } catch (validationError) {
                if (validationError.message === 'Profile picture must be an image file') {
                    return errorResponse(res, 400, 'Profile picture must be an image file', 'INVALID_FILE_TYPE');
                }
                if (validationError.message === 'Profile picture must be less than 5MB') {
                    return errorResponse(res, 400, 'Profile picture must be less than 5MB', 'FILE_TOO_LARGE');
                }
                // Re-throw other errors
                throw validationError;
            }
        }

        const userData = req.body;
        
        try {
            // Upload profile picture if provided
            const profilePictureUrl = await uploadProfilePicture(profilePictureFile, decoded.uid);
            
            // Add profile picture URL to userData if upload was successful
            if (profilePictureUrl) {
                userData.profilePicture = profilePictureUrl;
            }

            const updatedUser = await userService.updateUserInfo(decoded.uid, userData);
            res.status(200).json(updatedUser);
        } catch (fileError) {
            // If file upload fails, log error but still update other user data
            console.error('Error uploading profile picture during update:', fileError);
            const updatedUser = await userService.updateUserInfo(decoded.uid, userData);
            res.status(200).json({
                ...updatedUser,
                warning: 'User updated but profile picture upload failed'
            });
        }
    } catch (error) {
        console.error('Error updating user info:', error);
        if (error.message === 'User not found') {
            return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
        }
        return errorResponse(res, 500, 'Internal server error');
    }
}

async function googleUserAuth(req, res) {
    try {
        const { idToken, accessToken } = req.body;
        if (!accessToken) {
            return errorResponse(res, 400, 'Missing accessToken', 'MISSING_ACCESSTOKEN');
        }
        const result = await userService.googleUserAuth(accessToken);

        // Set session cookie
        res.cookie('__session', result.sessionCookie, {
            maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });

        res.status(200).json({
            uid: result.uid,
            email: result.email,
            sessionCookie: result.sessionCookie,
            isNewUser: result.isNewUser
        });
    } catch (error) {
        console.error('Error verifying and creating Google user:', error);
        if (error.code === 'auth/id-token-expired') {
            return errorResponse(res, 401, 'ID token expired', 'ID_TOKEN_EXPIRED');
        }
        if (error.code === 'auth/id-token-revoked') {
            return errorResponse(res, 401, 'ID token revoked', 'ID_TOKEN_REVOKED');
        }
        if (error.code === 'auth/argument-error') {
            return errorResponse(res, 400, 'Invalid ID token', 'INVALID_ID_TOKEN');
        }
        return errorResponse(res, 500, 'Failed to verify and create Google user', 'GOOGLE_AUTH_FAILED');
    }
}



module.exports = { registerUser, loginUser, logoutUser, deleteUser, getMyUserInfo, getUserPublicInfoByEmail, updateUserInfo, googleUserAuth };