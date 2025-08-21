import Book from '../models/Book.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

// Display search form and list of books
export const exploreBooks = async (req, res) => {
  try {
    const { search = '', category = '', availability = '' } = req.query;
    const filter = {};
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    if (search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    if (category && category !== '') {
      filter.category = category;
    }

    if (availability && availability !== '') {
      filter.availability = availability === 'true';
    }

    const totalBooks = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .populate('currentBorrower', 'name')
      .sort(search.trim() ? { score: { $meta: 'textScore' } } : { addedDate: -1 })
      .skip(skip)
      .limit(limit);

    const categories = await Book.distinct('category');
    const totalPages = Math.ceil(totalBooks / limit);

    res.render('explore', { 
      books, 
      search, 
      category, 
      availability,
      categories,
      currentPage: page,
      totalPages,
      totalBooks
    });
  } catch (error) {
    console.error('Explore books error:', error);
    req.flash('error', 'Error loading books');
    res.render('explore', { 
      books: [], 
      search: '', 
      category: '', 
      availability: '',
      categories: [],
      currentPage: 1,
      totalPages: 1,
      totalBooks: 0
    });
  }
};

// Show add book form (for admin)
export const addBookForm = (req, res) => {
  res.render('addBook');
};

// Handle book addition
export const addNewBook = async (req, res) => {
  try {
    const { title, author, category, description, isbn, publishedYear, pages } = req.body;

    if (!title || !author || !category) {
      req.flash('error', 'Please fill all required fields.');
      return res.render('addBook');
    }

    // Check for duplicate ISBN if provided
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        req.flash('error', 'A book with this ISBN already exists.');
        return res.render('addBook');
      }
    }

    const book = new Book({ 
      title: title.trim(), 
      author: author.trim(), 
      category, 
      description: description?.trim() || '',
      isbn: isbn?.trim() || undefined,
      publishedYear: publishedYear || undefined,
      pages: pages || undefined
    });
    
    await book.save();

    // TODO: Notify users about new book via email

    req.flash('success', 'Book added successfully!');
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Add book error:', error);
    req.flash('error', 'Error adding book. Please try again.');
    res.render('addBook');
  }
};

// Borrow a book
export const borrowBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.session.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/explore');
    }

    if (!book.availability) {
      req.flash('error', 'Book is currently unavailable.');
      return res.redirect('/explore');
    }

    const user = await User.findById(userId);
    
    // Check if user already has too many books (limit: 3)
    if (user.issuedBooks.length >= 3) {
      req.flash('error', 'You have reached the maximum limit of 3 books.');
      return res.redirect('/explore');
    }

    // Check if user has already borrowed this book and not returned it
    const existingActivity = await Activity.findOne({
      userId,
      bookId,
      status: 'active'
    });
    
    if (existingActivity) {
      req.flash('error', 'You have already borrowed this book.');
      return res.redirect('/explore');
    }

    // Calculate due date (14 days from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Update book availability and current borrower
    book.availability = false;
    book.currentBorrower = userId;
    await book.save();

    // Add book to user's issued books
    user.issuedBooks.push(bookId);
    await user.save();

    // Create activity record
    const activity = new Activity({
      userId,
      bookId,
      action: 'borrow',
      dueDate,
      status: 'active'
    });
    await activity.save();

    req.flash('success', `Successfully borrowed "${book.title}". Due date: ${dueDate.toLocaleDateString()}`);
    res.redirect('/activity');
  } catch (error) {
    console.error('Borrow book error:', error);
    req.flash('error', 'Error borrowing book. Please try again.');
    res.redirect('/explore');
  }
};

// Return a book
export const returnBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.session.userId;

    const book = await Book.findById(bookId);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/activity');
    }

    // Find the active borrowing activity
    const activity = await Activity.findOne({
      userId,
      bookId,
      status: 'active'
    });

    if (!activity) {
      req.flash('error', 'No active borrowing record found for this book.');
      return res.redirect('/activity');
    }

    const user = await User.findById(userId);

    // Calculate fine if overdue
    let fine = 0;
    const today = new Date();
    if (today > activity.dueDate) {
      const daysOverdue = Math.ceil((today - activity.dueDate) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 1; // $1 per day
    }

    // Update book availability
    book.availability = true;
    book.currentBorrower = null;
    await book.save();

    // Remove book from user's issued books
    user.issuedBooks.pull(bookId);
    await user.save();

    // Update activity record
    activity.status = 'returned';
    activity.returnDate = today;
    activity.fine = fine;
    await activity.save();

    // Create return activity record
    const returnActivity = new Activity({
      userId,
      bookId,
      action: 'return',
      returnDate: today,
      status: 'returned',
      fine
    });
    await returnActivity.save();

    const message = fine > 0 
      ? `Successfully returned "${book.title}". Fine: $${fine} (${Math.ceil((today - activity.dueDate) / (1000 * 60 * 60 * 24))} days overdue)`
      : `Successfully returned "${book.title}".`;
    
    req.flash('success', message);
    res.redirect('/activity');
  } catch (error) {
    console.error('Return book error:', error);
    req.flash('error', 'Error returning book. Please try again.');
    res.redirect('/activity');
  }
};

// Get book details (for modal or separate page)
export const getBookDetails = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('currentBorrower', 'name');
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Get book details error:', error);
    res.status(500).json({ error: 'Error fetching book details' });
  }
};

// Admin: Get all books with pagination
export const adminGetBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const availability = req.query.availability || '';

    const filter = {};
    
    if (search.trim()) {
      filter.$text = { $search: search.trim() };
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (availability !== '') {
      filter.availability = availability === 'true';
    }

    const totalBooks = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .populate('currentBorrower', 'name email')
      .sort(search.trim() ? { score: { $meta: 'textScore' } } : { addedDate: -1 })
      .skip(skip)
      .limit(limit);

    const categories = await Book.distinct('category');
    const totalPages = Math.ceil(totalBooks / limit);

    res.render('admin/books', {
      books,
      categories,
      search,
      category,
      availability,
      currentPage: page,
      totalPages,
      totalBooks
    });
  } catch (error) {
    console.error('Admin get books error:', error);
    req.flash('error', 'Error loading books');
    res.render('admin/books', {
      books: [],
      categories: [],
      search: '',
      category: '',
      availability: '',
      currentPage: 1,
      totalPages: 1,
      totalBooks: 0
    });
  }
};

// Admin: Delete book
export const deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Check if book is currently borrowed
    const book = await Book.findById(bookId);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/admin/books');
    }
    
    if (!book.availability) {
      req.flash('error', 'Cannot delete book that is currently borrowed.');
      return res.redirect('/admin/books');
    }

    await Book.findByIdAndDelete(bookId);
    
    req.flash('success', 'Book deleted successfully.');
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Delete book error:', error);
    req.flash('error', 'Error deleting book.');
    res.redirect('/admin/books');
  }
};

// Admin: Edit book form
export const editBookForm = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      req.flash('error', 'Book not found.');
      return res.redirect('/admin/books');
    }
    
    res.render('admin/editBook', { book });
  } catch (error) {
    console.error('Edit book form error:', error);
    req.flash('error', 'Error loading book.');
    res.redirect('/admin/books');
  }
};

// Admin: Update book
export const updateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { title, author, category, description, isbn, publishedYear, pages } = req.body;

    if (!title || !author || !category) {
      req.flash('error', 'Please fill all required fields.');
      return res.redirect(`/admin/books/${bookId}/edit`);
    }

    // Check for duplicate ISBN if provided and different from current
    if (isbn) {
      const existingBook = await Book.findOne({ isbn, _id: { $ne: bookId } });
      if (existingBook) {
        req.flash('error', 'A book with this ISBN already exists.');
        return res.redirect(`/admin/books/${bookId}/edit`);
      }
    }

    await Book.findByIdAndUpdate(bookId, {
      title: title.trim(),
      author: author.trim(),
      category,
      description: description?.trim() || '',
      isbn: isbn?.trim() || undefined,
      publishedYear: publishedYear || undefined,
      pages: pages || undefined
    });

    req.flash('success', 'Book updated successfully.');
    res.redirect('/admin/books');
  } catch (error) {
    console.error('Update book error:', error);
    req.flash('error', 'Error updating book.');
    res.redirect(`/admin/books/${req.params.id}/edit`);
  }
};
