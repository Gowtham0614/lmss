import User from '../models/User.js';

export const updateProfile = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { name } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.userId, { name });
    res.redirect('/profile');
  } catch (e) {
    res.render('profile', { error: 'Failed to update profile' });
  }
};


