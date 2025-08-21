import User from '../models/User.js';
import Book from '../models/Book.js';
import Activity from '../models/Activity.js';

// Admin Dashboard with KPIs
export const adminDashboard = async (req, res) => {
  try {
    // Get key metrics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ availability: true });
    const borrowedBooks = await Book.countDocuments({ availability: false });
    const activeLoans = await Activity.countDocuments({ status: 'active' });
    const overdueLoans = await Activity.countDocuments({ status: 'overdue' });
    
    // Get recent activities (last 10)
    const recentActivities = await Activity.find()
      .populate('userId', 'name email')
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get overdue activities
    const overdueActivities = await Activity.find({ status: 'overdue' })
      .populate('userId', 'name email')
      .populate('bookId', 'title author')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get monthly statistics for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Activity.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          },
          action: 'borrow'
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Fill in missing months with 0
    const monthlyData = new Array(12).fill(0);
    monthlyStats.forEach(stat => {
      monthlyData[stat._id - 1] = stat.count;
    });

    // Popular books (most borrowed)
    const popularBooks = await Activity.aggregate([
      { $match: { action: 'borrow' } },
      { $group: { _id: '$bookId', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $project: { title: '$book.title', author: '$book.author', borrowCount: 1 } }
    ]);

    // Active users (users with most activity)
    const activeUsers = await Activity.aggregate([
      { $group: { _id: '$userId', activityCount: { $sum: 1 } } },
      { $sort: { activityCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', activityCount: 1 } }
    ]);

    res.render('admin/dashboard', {
      stats: {
        totalUsers,
        totalBooks,
        availableBooks,
        borrowedBooks,
        activeLoans,
        overdueLoans
      },
      recentActivities,
      overdueActivities,
      monthlyData: JSON.stringify(monthlyData),
      popularBooks,
      activeUsers,
      currentYear
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Error loading dashboard');
    res.render('admin/dashboard', {
      stats: { totalUsers: 0, totalBooks: 0, availableBooks: 0, borrowedBooks: 0, activeLoans: 0, overdueLoans: 0 },
      recentActivities: [],
      overdueActivities: [],
      monthlyData: JSON.stringify(new Array(12).fill(0)),
      popularBooks: [],
      activeUsers: [],
      currentYear: new Date().getFullYear()
    });
  }
};

// Admin: Get all users with pagination and search
export const adminGetUsers = async (req, res) => {
  try {
    const { search = '', role = 'all', status = 'all', page = 1 } = req.query;
    const limit = 15;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    
    if (role !== 'all') {
      filter.role = role;
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const totalUsers = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .populate('issuedBooks', 'title author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render('admin/users', {
      users,
      search,
      role,
      status,
      currentPage: parseInt(page),
      totalPages,
      totalUsers
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    req.flash('error', 'Error loading users');
    res.render('admin/users', {
      users: [],
      search: '',
      role: 'all',
      status: 'all',
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0
    });
  }
};

// Admin: Get user details with activity history
export const adminGetUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select('-password')
      .populate('issuedBooks', 'title author dueDate');

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    // Get user's activity history
    const activities = await Activity.find({ userId })
      .populate('bookId', 'title author category')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get user's current borrowed books with due dates
    const currentBorrows = await Activity.find({
      userId,
      status: { $in: ['active', 'overdue'] }
    })
      .populate('bookId', 'title author category')
      .sort({ dueDate: 1 });

    res.render('admin/userDetails', {
      user,
      activities,
      currentBorrows
    });
  } catch (error) {
    console.error('Admin get user details error:', error);
    req.flash('error', 'Error loading user details');
    res.redirect('/admin/users');
  }
};

// Admin: Update user status (activate/deactivate)
export const adminUpdateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: isActive === 'true' },
      { new: true }
    );

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    req.flash('success', `User ${user.name} has been ${isActive === 'true' ? 'activated' : 'deactivated'}`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Admin update user status error:', error);
    req.flash('error', 'Error updating user status');
    res.redirect('/admin/users');
  }
};

// Admin: Delete user (only if no active borrows)
export const adminDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has active borrows
    const activeBorrows = await Activity.countDocuments({
      userId,
      status: { $in: ['active', 'overdue'] }
    });

    if (activeBorrows > 0) {
      req.flash('error', 'Cannot delete user with active book borrows');
      return res.redirect('/admin/users');
    }

    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/admin/users');
    }

    req.flash('success', `User ${user.name} has been deleted`);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Admin delete user error:', error);
    req.flash('error', 'Error deleting user');
    res.redirect('/admin/users');
  }
};

// Admin: Force return book
export const adminForceReturn = async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const { fine = 0, notes = '' } = req.body;

    // Find active activity
    const activity = await Activity.findOne({
      userId,
      bookId,
      status: { $in: ['active', 'overdue'] }
    });

    if (!activity) {
      req.flash('error', 'No active borrow record found');
      return res.redirect(`/admin/users/${userId}`);
    }

    // Update book
    await Book.findByIdAndUpdate(bookId, {
      availability: true,
      currentBorrower: null
    });

    // Update user
    await User.findByIdAndUpdate(userId, {
      $pull: { issuedBooks: bookId }
    });

    // Update activity
    activity.status = 'returned';
    activity.returnDate = new Date();
    activity.fine = parseFloat(fine) || 0;
    activity.notes = notes.trim();
    await activity.save();

    // Create return activity
    const returnActivity = new Activity({
      userId,
      bookId,
      action: 'return',
      returnDate: new Date(),
      status: 'returned',
      fine: parseFloat(fine) || 0,
      notes: `Admin forced return: ${notes}`.trim()
    });
    await returnActivity.save();

    const book = await Book.findById(bookId);
    req.flash('success', `Book "${book.title}" has been returned by admin`);
    res.redirect(`/admin/users/${userId}`);
  } catch (error) {
    console.error('Admin force return error:', error);
    req.flash('error', 'Error processing return');
    res.redirect(`/admin/users/${userId}`);
  }
};

// Admin: System statistics API
export const getSystemStats = async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        admins: await User.countDocuments({ role: 'admin' })
      },
      books: {
        total: await Book.countDocuments(),
        available: await Book.countDocuments({ availability: true }),
        borrowed: await Book.countDocuments({ availability: false })
      },
      activities: {
        total: await Activity.countDocuments(),
        active: await Activity.countDocuments({ status: 'active' }),
        overdue: await Activity.countDocuments({ status: 'overdue' }),
        returned: await Activity.countDocuments({ status: 'returned' })
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Error fetching system statistics' });
  }
};
