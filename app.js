const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://192.168.10.162:3000', 'http://192.168.10.93:5173'];  // Frontend React URL
const corsOptions = {

    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true, // ส่ง cookies/credentials ไปด้วย
};

app.use(cors(corsOptions)); // ใช้งาน CORS

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // ถ้า production ต้องเป็น true และมี https
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '192.168.10.162', () => console.log(`Server running on port ${PORT}`));
