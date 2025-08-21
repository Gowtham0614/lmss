import express from 'express';
import { 
  exploreBooks, 
  addBookForm, 
  addNewBook,
  borrowBook,
  returnBook,
  getBookDetails,
  adminGetBooks,
  deleteBook,
  editBookForm,
  updateBook
} from '../controllers/bookController.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public/User routes
router.get('/explore', isAuthenticated, exploreBooks);
router.get('/api/books/:id', isAuthenticated, getBookDetails);
router.post('/books/:id/borrow', isAuthenticated, borrowBook);
router.post('/books/:id/return', isAuthenticated, returnBook);

// Admin routes
router.get('/admin/books', isAdmin, adminGetBooks);
router.get('/admin/books/add', isAdmin, addBookForm);
router.post('/admin/books/add', isAdmin, addNewBook);
router.get('/admin/books/:id/edit', isAdmin, editBookForm);
router.put('/admin/books/:id', isAdmin, updateBook);
router.delete('/admin/books/:id', isAdmin, deleteBook);

// Legacy routes (keeping for compatibility)
router.get('/addBook', isAdmin, addBookForm);
router.post('/addBook', isAdmin, addNewBook);
router.get('/books', isAuthenticated, exploreBooks); // Redirect /books to /explore
router.get('/books/add', isAdmin, addBookForm);

export default router;
