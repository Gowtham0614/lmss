import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  issuedBooks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book' 
  }],
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full profile
userSchema.virtual('borrowCount').get(function() {
  return this.issuedBooks.length;
});

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

export default mongoose.model('User', userSchema);
