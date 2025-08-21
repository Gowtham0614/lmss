import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Render Registration page
export const registerView = (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('register');
};

// Render Login page
export const loginView = (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('login');
};

// Handle registration
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render('register', { error: 'Please fill all fields.' });
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render('register', { error: 'Email is already registered.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  req.session.userId = user._id;
  res.redirect('/dashboard');
};

// Handle login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('login', { error: 'Invalid email or password.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render('login', { error: 'Invalid email or password.' });
  }
  req.session.userId = user._id;
  res.redirect('/dashboard');
};

// Logout user
export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
