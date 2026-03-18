require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('../config/database');
const initSocket = require('../sockets');

const app = express();
const server = http.createServer(app);

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/users', require('../routes/users'));
app.use('/api/rides', require('../routes/rides'));

// Socket.IO
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
