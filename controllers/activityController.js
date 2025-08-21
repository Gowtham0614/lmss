import Activity from '../models/Activity.js';
import Book from '../models/Book.js';
import User from '../models/User.js';

// Display user's activity history with filters
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { status = 'all', page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId };
    if (status !== 'all') {
      filter.status = status;
    }

    // Get total count for pagination
    const totalActivities = await Activity.countDocuments(filter);
    
    // Fetch activities with populated book details
    const activities = await Activity.find(filter)
      .populate('bookId', 'title author category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Check for overdue books and update status
    const today = new Date();
    const overdueUpdates = [];
    
    activities.forEach(activity => {
      if (activity.status === 'active' && activity.dueDate && today > activity.dueDate) {
        activity.status = 'overdue';
        overdueUpdates.push(activity.save());
      }
    });
    
    // Save any overdue status updates
    await Promise.all(overdueUpdates);

    // Calculate summary statistics
    const stats = await Activity.aggregate([
      { $match: { userId: userId } },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryStats = {
      total: 0,
      active: 0,
      returned: 0,
      overdue: 0
    };

    stats.forEach(stat => {
      summaryStats[stat._id] = stat.count;
      summaryStats.total += stat.count;
    });

    const totalPages = Math.ceil(totalActivities / limit);

    res.render('activity', { 
      activities, 
      status,
      currentPage: parseInt(page),
      totalPages,
      totalActivities,
      summaryStats
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    req.flash('error', 'Error loading activity history');
    res.render('activity', { 
      activities: [], 
      status: 'all',
      currentPage: 1,
      totalPages: 1,
      totalActivities: 0,
      summaryStats: { total: 0, active: 0, returned: 0, overdue: 0 }
    });
  }
};

// Legacy function name for compatibility
export const userActivity = getUserActivity;

// Admin: View all activities with advanced filters
export const adminGetActivities = async (req, res) => {
  try {
    const { 
      status = 'all', 
      user = '', 
      book = '', 
      startDate = '', 
      endDate = '',
      page = 1 
    } = req.query;
    
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      if (filter.createdAt) {
        filter.createdAt.$lte = new Date(endDate);
      } else {
        filter.createdAt = { $lte: new Date(endDate) };
      }
    }

    // Handle user search
    if (user.trim()) {
      const users = await User.find({
        $or: [
          { name: { $regex: user.trim(), $options: 'i' } },
          { email: { $regex: user.trim(), $options: 'i' } }
        ]
      }).select('_id');
      
      filter.userId = { $in: users.map(u => u._id) };
    }

    // Handle book search
    if (book.trim()) {
      const books = await Book.find({
        $or: [
          { title: { $regex: book.trim(), $options: 'i' } },
          { author: { $regex: book.trim(), $options: 'i' } }
        ]
      }).select('_id');
      
      filter.bookId = { $in: books.map(b => b._id) };
    }

    const totalActivities = await Activity.countDocuments(filter);
    
    const activities = await Activity.find(filter)
      .populate('userId', 'name email')
      .populate('bookId', 'title author category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get summary statistics
    const stats = await Activity.aggregate([
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryStats = {
      total: 0,
      active: 0,
      returned: 0,
      overdue: 0
    };

    stats.forEach(stat => {
      summaryStats[stat._id] = stat.count;
      summaryStats.total += stat.count;
    });

    const totalPages = Math.ceil(totalActivities / limit);

    res.render('admin/activities', {
      activities,
      status,
      user,
      book,
      startDate,
      endDate,
      currentPage: parseInt(page),
      totalPages,
      totalActivities,
      summaryStats
    });
  } catch (error) {
    console.error('Admin get activities error:', error);
    req.flash('error', 'Error loading activities');
    res.render('admin/activities', {
      activities: [],
      status: 'all',
      user: '',
      book: '',
      startDate: '',
      endDate: '',
      currentPage: 1,
      totalPages: 1,
      totalActivities: 0,
      summaryStats: { total: 0, active: 0, returned: 0, overdue: 0 }
    });
  }
};

// Get overdue activities for dashboard
export const getOverdueActivities = async (req, res) => {
  try {
    const overdueActivities = await Activity.findOverdue();
    res.json(overdueActivities);
  } catch (error) {
    console.error('Get overdue activities error:', error);
    res.status(500).json({ error: 'Error fetching overdue activities' });
  }
};

// Get activities due soon
export const getActivitiesDueSoon = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 2;
    const dueSoonActivities = await Activity.findDueSoon(days);
    res.json(dueSoonActivities);
  } catch (error) {
    console.error('Get activities due soon error:', error);
    res.status(500).json({ error: 'Error fetching activities due soon' });
  }
};

// Legacy functions - kept for compatibility but updated
export const issueBook = async (req, res) => {
  // This is now handled by bookController.borrowBook
  req.flash('error', 'This functionality has been moved. Please use the explore page to borrow books.');
  res.redirect('/explore');
};

export const returnBook = async (req, res) => {
  // This is now handled by bookController.returnBook
  req.flash('error', 'This functionality has been moved. Please use the activity page to return books.');
  res.redirect('/activity');
};
