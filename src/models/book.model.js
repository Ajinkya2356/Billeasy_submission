const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a book title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Please provide an author name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a book description']
  },
  genre: {
    type: String,
    required: [true, 'Please provide a genre'],
    enum: [
      'Fiction', 
      'Non-fiction', 
      'Fantasy', 
      'Science Fiction', 
      'Mystery', 
      'Thriller', 
      'Romance', 
      'Biography', 
      'History', 
      'Self-help',
      'Other'
    ]
  },
  publicationYear: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for reviews
bookSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'book',
  justOne: false
});

// Static method to get average rating
bookSchema.statics.getAverageRating = async function(bookId) {
  const obj = await this.model('Review').aggregate([
    {
      $match: { book: bookId }
    },
    {
      $group: {
        _id: '$book',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    await this.findByIdAndUpdate(bookId, {
      averageRating: obj.length > 0 ? obj[0].averageRating : 0
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = mongoose.model('Book', bookSchema);