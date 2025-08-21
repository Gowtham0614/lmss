import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but unique when present
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'General',
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 
           'Biography', 'Mystery', 'Romance', 'Fantasy', 'Self-Help', 
           'Business', 'Health', 'Education', 'General']
  },
  availability: {
    type: Boolean,
    default: true
  },
  currentBorrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  publishedYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  pages: {
    type: Number,
    min: 1
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create indexes for better search performance
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ availability: 1 });
bookSchema.index({ addedDate: -1 });

export default mongoose.model('Book', bookSchema);
