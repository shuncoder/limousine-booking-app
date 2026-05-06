require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/database');
const { initSocket } = require('./sockets/socket');
const { startSeatJobs } = require('./jobs/seatJobs');
const { startSeatHoldWatcher } = require('./jobs/seatHoldWatcher');
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  require('./config/gmail'); // Initialize Passport with Google OAuth
}

const app = express();
const server = http.createServer(app);

// Connect to DB 
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/routing', require('./routes/routing'));

// Socket.IO
initSocket(server);

// Background jobs: expire seat holds & pending tickets
startSeatHoldWatcher();
startSeatJobs();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
