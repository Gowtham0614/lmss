import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import User from './models/User.js';
import { optionalAuth } from './middleware/auth.js';




dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'PUBLIC')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Session setup with Mongo store
app.use(session({
  secret: process.env.SESSION_SECRET || 'librarysecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// Flash messages middleware
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// Enhanced auth middleware - expose auth state and current user to views
app.use(async (req, res, next) => {
  try {
    res.locals.isAuthenticated = Boolean(req.session.userId);
    if (res.locals.isAuthenticated) {
      const user = await User.findById(req.session.userId).select('name email role');
      res.locals.user = user || null;
    } else {
      res.locals.user = null;
    }
    console.log('Locals set:', { isAuthenticated: res.locals.isAuthenticated, user: res.locals.user ? res.locals.user.name : 'null' });
  } catch (error) {
    console.error('Error setting locals:', error);
    res.locals.isAuthenticated = false;
    res.locals.user = null;
  }
  next();
});

// Public routes (accessible without authentication)
app.use('/login', authLimiter); // Apply rate limiting to login
app.use('/register', authLimiter); // Apply rate limiting to register
app.use('/', authRoutes); // Login/Register

// Home page route - redirect authenticated users to dashboard
app.get('/', (req, res) => {
  if (req.session.userId) {
    console.log('User authenticated, redirecting to dashboard');
    return res.redirect('/dashboard');
  }
  console.log('Rendering index for unauthenticated user');
  res.render('index');
});

// Dashboard route for authenticated users
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    console.log('Unauthenticated access to dashboard, redirecting to home');
    return res.redirect('/');
  }
  console.log('Rendering dashboard for authenticated user:', res.locals.user?.name);
  res.render('dashboard');
});

// Protected routes - require authentication
app.use('/explore', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
});

app.use('/activity', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
});

app.use('/profile', (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
});

app.use('/', indexRoutes);
app.use('/', bookRoutes);
app.use('/', activityRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes); // Admin routes

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
