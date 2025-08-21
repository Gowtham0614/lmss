import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  action: {
    type: String,
    enum: ['borrow', 'return', 'renew', 'reserve'],
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: function() { return this.action === 'borrow' || this.action === 'renew'; }
  },
  returnDate: {
    type: Date,
    required: function() { return this.action === 'return'; }
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost'],
    default: function() {
      if (this.action === 'return') return 'returned';
      if (this.action === 'borrow') return 'active';
      return 'active';
    }
  },
  fine: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ bookId: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ dueDate: 1 });
activitySchema.index({ action: 1 });

// Virtual to check if book is overdue
activitySchema.virtual('isOverdue').get(function() {
  if (this.status === 'returned' || !this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual to calculate days overdue
activitySchema.virtual('daysOverdue').get(function() {
  if (!this.isOverdue) return 0;
  const diffTime = Math.abs(new Date() - this.dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to find overdue books
activitySchema.statics.findOverdue = function() {
  return this.find({
    status: 'active',
    dueDate: { $lt: new Date() }
  }).populate('userId bookId');
};

// Static method to find books due soon (within days)
activitySchema.statics.findDueSoon = function(days = 2) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    dueDate: { 
      $gte: new Date(),
      $lte: futureDate 
    }
  }).populate('userId bookId');
};

export default mongoose.model('Activity', activitySchema);
