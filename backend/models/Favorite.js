import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Meal', 'MealPlan', 'GroceryList'],
  },
  folder: {
    type: String,
    default: 'Uncategorized',
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  }
}, {
  timestamps: true,
});

favoriteSchema.index({ user: 1, folder: 1 });
favoriteSchema.index({ user: 1, type: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
