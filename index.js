require('dotenv').config();

// Validate and log environment secrets
console.log('🔐 Checking environment secrets...');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

if (FIREBASE_API_KEY) {
    console.log('✅ FIREBASE_API_KEY found:', FIREBASE_API_KEY.substring(0, 20) + '...');
} else {
    console.error('❌ FIREBASE_API_KEY is missing!');
}

if (FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ FIREBASE_SERVICE_ACCOUNT is valid JSON');
        console.log('   - Project ID:', serviceAccount.project_id);
        console.log('   - Client Email:', serviceAccount.client_email);
        console.log('   - Has Private Key:', !!serviceAccount.private_key);
    } catch (error) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON:', error.message);
    }
} else {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT is missing!');
}

console.log(''); // Empty line for readability

const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const http = require('http');

const server = http.createServer(app);

app.get('/', (_req, res) => {
    const version = require('./package.json').version;
    console.log(`API Server Version: ${version}`);
    res.json({ version });
});

app.use('/users', require('./src/routers/userRouter'));
app.use('/events', require('./src/routers/eventRouter'));
app.use('/path-points', require('./src/routers/pathPointRouter'));
app.use('/path-edges', require('./src/routers/pathEdgeRouter'));
app.use('/locations', require('./src/routers/locationRouter'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});


