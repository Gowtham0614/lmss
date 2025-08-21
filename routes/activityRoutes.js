import express from 'express';
import { issueBook, returnBook, userActivity } from '../controllers/activityController.js';

const router = express.Router();

// Route to display user's activity log
router.get('/activity', userActivity);

// Route to issue a book to the logged-in user
router.post('/books/borrow/:id', issueBook);

// Route to return a borrowed book
router.post('/books/return/:id', returnBook);

export default router;
