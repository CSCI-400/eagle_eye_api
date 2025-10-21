require('dotenv').config();

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
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

