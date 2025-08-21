import express from 'express';
const router = express.Router();

// Explore/Search books page
router.get('/explore', (req, res) => {
  res.render('explore', { books: [] });
});

// User profile page
router.get('/dashboard', (req, res) => {
  res.render('profile');
});

// Profile page (linked from navbar)
router.get('/profile', (req, res) => {
  res.render('profile');
});

export default router;
