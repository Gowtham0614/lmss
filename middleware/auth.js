import User from '../models/User.js';

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).render('error', { 
        error: 'Access denied. Admin privileges required.',
        statusCode: 403
      });
    }
    
    req.user = user; // Attach user to request for use in controllers
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).render('error', { 
      error: 'Internal server error',
      statusCode: 500
    });
  }
};

// Middleware to attach user info to request (for authenticated routes)
export const attachUser = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      req.user = user;
      res.locals.currentUser = user;
      res.locals.isAdmin = user && user.role === 'admin';
    }
    next();
  } catch (error) {
    console.error('Attach user middleware error:', error);
    next();
  }
};

// Optional authentication (for pages that work with or without login)
export const optionalAuth = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      req.user = user;
      res.locals.currentUser = user;
      res.locals.isAdmin = user && user.role === 'admin';
    } else {
      res.locals.currentUser = null;
      res.locals.isAdmin = false;
    }
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    res.locals.currentUser = null;
    res.locals.isAdmin = false;
    next();
  }
};
