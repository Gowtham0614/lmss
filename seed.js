import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Book from './models/Book.js';
import Activity from './models/Activity.js';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// Clear existing data
console.log('Clearing existing data...');
await User.deleteMany({});
await Book.deleteMany({});
await Activity.deleteMany({});

// Sample Users (3 admins, 9 regular users)
const users = [
  // Admin users
  {
    name: 'Admin User',
    email: 'admin@smartlibrary.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    phone: '+1234567890',
    address: '123 Library Admin St, Book City, BC 12345'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.admin@smartlibrary.com', 
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    phone: '+1234567891',
    address: '456 Admin Ave, Book City, BC 12346'
  },
  {
    name: 'Michael Chen',
    email: 'michael.admin@smartlibrary.com',
    password: await bcrypt.hash('admin123', 10), 
    role: 'admin',
    phone: '+1234567892',
    address: '789 Library Lane, Book City, BC 12347'
  },
  // Regular users
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567893',
    address: '321 Reader Rd, Book City, BC 12348'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user', 
    phone: '+1234567894',
    address: '654 Novel St, Book City, BC 12349'
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567895', 
    address: '987 Fiction Ave, Book City, BC 12350'
  },
  {
    name: 'Lisa Brown',
    email: 'lisa.brown@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567896',
    address: '159 Study St, Book City, BC 12351'
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567897',
    address: '753 Knowledge Ln, Book City, BC 12352'
  },
  {
    name: 'Jennifer Miller',
    email: 'jennifer.miller@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567898',
    address: '951 Learning Way, Book City, BC 12353'
  },
  {
    name: 'Christopher Lee',
    email: 'chris.lee@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567899',
    address: '357 Education Blvd, Book City, BC 12354'
  },
  {
    name: 'Amanda Garcia',
    email: 'amanda.garcia@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567800',
    address: '852 Wisdom Ave, Book City, BC 12355'
  },
  {
    name: 'James Rodriguez',
    email: 'james.rodriguez@email.com',
    password: await bcrypt.hash('user123', 10),
    role: 'user',
    phone: '+1234567801',
    address: '741 Discovery Dr, Book City, BC 12356'
  }
];

console.log('Creating users...');
const createdUsers = await User.insertMany(users);
console.log(`Created ${createdUsers.length} users`);

// Sample Books (30 diverse books)
const books = [
  // Fiction
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', publishedYear: 1925, pages: 180, isbn: '978-0-7432-7356-5', description: 'A classic American novel about the Jazz Age.' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', publishedYear: 1960, pages: 376, isbn: '978-0-06-112008-4', description: 'A story about racial injustice in the American South.' },
  { title: '1984', author: 'George Orwell', category: 'Fiction', publishedYear: 1949, pages: 328, isbn: '978-0-452-28423-4', description: 'A dystopian novel about totalitarian control.' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', publishedYear: 1813, pages: 432, isbn: '978-0-14-143951-8', description: 'A romantic novel about Elizabeth Bennet and Mr. Darcy.' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', publishedYear: 1951, pages: 277, isbn: '978-0-316-76948-0', description: 'Coming-of-age story of Holden Caulfield.' },
  
  // Science Fiction & Fantasy
  { title: 'Dune', author: 'Frank Herbert', category: 'Fantasy', publishedYear: 1965, pages: 688, isbn: '978-0-441-17271-9', description: 'Epic science fiction novel set on the desert planet Arrakis.' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', publishedYear: 1937, pages: 310, isbn: '978-0-547-92822-7', description: 'Bilbo Baggins\' unexpected adventure.' },
  { title: 'Foundation', author: 'Isaac Asimov', category: 'Science', publishedYear: 1951, pages: 244, isbn: '978-0-553-29335-0', description: 'First book in the Foundation series about psychohistory.' },
  { title: 'Neuromancer', author: 'William Gibson', category: 'Science', publishedYear: 1984, pages: 271, isbn: '978-0-441-56956-9', description: 'Cyberpunk novel that defined the genre.' },
  
  // Mystery & Thriller
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', category: 'Mystery', publishedYear: 2005, pages: 590, isbn: '978-0-307-45454-1', description: 'Swedish crime thriller about corruption and murder.' },
  { title: 'Gone Girl', author: 'Gillian Flynn', category: 'Mystery', publishedYear: 2012, pages: 419, isbn: '978-0-307-58836-4', description: 'Psychological thriller about a missing wife.' },
  { title: 'The Da Vinci Code', author: 'Dan Brown', category: 'Mystery', publishedYear: 2003, pages: 454, isbn: '978-0-385-50420-5', description: 'Mystery thriller involving religious symbolism.' },
  
  // Non-Fiction & Biography
  { title: 'Steve Jobs', author: 'Walter Isaacson', category: 'Biography', publishedYear: 2011, pages: 656, isbn: '978-1-4516-4853-9', description: 'Biography of Apple co-founder Steve Jobs.' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', publishedYear: 2011, pages: 443, isbn: '978-0-06-231609-7', description: 'A brief history of humankind.' },
  { title: 'Educated', author: 'Tara Westover', category: 'Biography', publishedYear: 2018, pages: 334, isbn: '978-0-399-59050-4', description: 'Memoir about education and family.' },
  
  // Business & Self-Help
  { title: 'Think and Grow Rich', author: 'Napoleon Hill', category: 'Self-Help', publishedYear: 1937, pages: 238, isbn: '978-1-585-42433-7', description: 'Classic self-help book about achieving success.' },
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', category: 'Self-Help', publishedYear: 1989, pages: 372, isbn: '978-1-982-13761-9', description: 'Personal development and leadership principles.' },
  { title: 'Good to Great', author: 'Jim Collins', category: 'Business', publishedYear: 2001, pages: 300, isbn: '978-0-06-662099-2', description: 'Business book about what makes companies great.' },
  { title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', publishedYear: 2011, pages: 336, isbn: '978-0-307-88789-4', description: 'Methodology for developing businesses and products.' },
  
  // Technology & Science
  { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', publishedYear: 2008, pages: 464, isbn: '978-0-13-235088-4', description: 'A handbook of agile software craftsmanship.' },
  { title: 'The Pragmatic Programmer', author: 'David Thomas', category: 'Technology', publishedYear: 1999, pages: 352, isbn: '978-0-201-61622-4', description: 'Your journey to mastery in software development.' },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', publishedYear: 1988, pages: 256, isbn: '978-0-553-38016-3', description: 'Popular science book about cosmology.' },
  
  // Health & Education
  { title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', publishedYear: 2018, pages: 320, isbn: '978-0-7352-1129-2', description: 'An easy and proven way to build good habits.' },
  { title: 'The Power of Now', author: 'Eckhart Tolle', category: 'Self-Help', publishedYear: 1997, pages: 236, isbn: '978-1-577-31152-6', description: 'A guide to spiritual enlightenment.' },
  { title: 'Becoming', author: 'Michelle Obama', category: 'Biography', publishedYear: 2018, pages: 448, isbn: '978-1-524-76313-8', description: 'Memoir of former First Lady Michelle Obama.' },
  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', category: 'Health', publishedYear: 2014, pages: 464, isbn: '978-0-670-78593-3', description: 'Brain, mind, and body in the healing of trauma.' },
  
  // General & Miscellaneous
  { title: 'Freakonomics', author: 'Steven D. Levitt', category: 'Non-Fiction', publishedYear: 2005, pages: 315, isbn: '978-0-06-073132-6', description: 'A rogue economist explores the hidden side of everything.' },
  { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', publishedYear: 1988, pages: 163, isbn: '978-0-06-112241-5', description: 'A philosophical novel about following your dreams.' },
  { title: 'Quiet', author: 'Susan Cain', category: 'Self-Help', publishedYear: 2012, pages: 333, isbn: '978-0-307-35214-9', description: 'The power of introverts in a world that cannot stop talking.' },
  { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', category: 'Science', publishedYear: 2010, pages: 381, isbn: '978-1-4000-5217-2', description: 'The story of how one woman\'s cells changed medicine.' }
];

console.log('Creating books...');
const createdBooks = await Book.insertMany(books);
console.log(`Created ${createdBooks.length} books`);

// Sample Activities (25 realistic borrowing activities)
const activities = [];
const regularUsers = createdUsers.filter(user => user.role === 'user');

// Generate realistic activities
for (let i = 0; i < 25; i++) {
  const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
  const book = createdBooks[Math.floor(Math.random() * createdBooks.length)];
  
  const issueDate = new Date();
  issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
  
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
  
  const isReturned = Math.random() > 0.4; // 60% chance of being returned
  let activity;
  
  if (isReturned) {
    // Create borrow activity
    activity = {
      userId: user._id,
      bookId: book._id,
      action: 'borrow',
      issueDate: issueDate,
      dueDate: dueDate,
      status: 'returned'
    };
    activities.push(activity);
    
    // Create return activity
    const returnDate = new Date(issueDate);
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 20) + 1); // Return 1-20 days after borrow
    
    activities.push({
      userId: user._id,
      bookId: book._id,
      action: 'return',
      issueDate: issueDate,
      returnDate: returnDate,
      status: 'returned'
    });
  } else {
    // Create active borrow
    const isOverdue = dueDate < new Date();
    activity = {
      userId: user._id,
      bookId: book._id,
      action: 'borrow',
      issueDate: issueDate,
      dueDate: dueDate,
      status: isOverdue ? 'overdue' : 'active',
      fine: isOverdue ? Math.floor(Math.random() * 10) + 1 : 0 // $1-10 fine for overdue
    };
    activities.push(activity);
    
    // Update book and user for active borrows
    book.availability = false;
    book.currentBorrower = user._id;
    user.issuedBooks.push(book._id);
  }
}

console.log('Creating activities...');
const createdActivities = await Activity.insertMany(activities);
console.log(`Created ${createdActivities.length} activities`);

// Update books and users with borrowed book information
console.log('Updating books and users...');
for (const user of createdUsers) {
  if (user.issuedBooks.length > 0) {
    await User.findByIdAndUpdate(user._id, { issuedBooks: user.issuedBooks });
  }
}

for (const book of createdBooks) {
  if (!book.availability) {
    await Book.findByIdAndUpdate(book._id, { 
      availability: false, 
      currentBorrower: book.currentBorrower 
    });
  }
}

console.log('✅ Seeding completed successfully!');
console.log('');
console.log('=== LOGIN CREDENTIALS ===');
console.log('Admin Users:');
console.log('Email: admin@smartlibrary.com | Password: admin123');
console.log('Email: sarah.admin@smartlibrary.com | Password: admin123'); 
console.log('Email: michael.admin@smartlibrary.com | Password: admin123');
console.log('');
console.log('Regular Users:');
console.log('Email: john.smith@email.com | Password: user123');
console.log('Email: emily.davis@email.com | Password: user123');
console.log('Email: david.wilson@email.com | Password: user123');
console.log('(and more...)');
console.log('');

// Disconnect from MongoDB
await mongoose.disconnect();
console.log('Disconnected from MongoDB');
