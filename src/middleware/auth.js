
function asyncMiddleware(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

const { admin } = require('../enviroment/firebase/firebase');

module.exports = asyncMiddleware(async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authorization.split('Bearer ')[1];
    try {
        // Only verify as session cookie
        const decodedToken = await admin.auth().verifySessionCookie(token, true);
        req.user = decodedToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid session cookie' });
    }
});