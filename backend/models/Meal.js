import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mealName: {
    type: String,
    required: [true, 'Meal name is required'],
    trim: true,
    maxlength: [100, 'Meal name cannot exceed 100 characters'],
  },
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
  },
  image: {
    type: String,
    default: '',
  },
  calories: {
    type: Number,
    required: [true, 'Calories are required'],
    min: [0, 'Calories must be positive'],
  },
  protein: {
    type: Number,
    default: 0,
    min: [0, 'Protein must be positive'],
  },
  carbs: {
    type: Number,
    default: 0,
    min: [0, 'Carbs must be positive'],
  },
  fat: {
    type: Number,
    default: 0,
    min: [0, 'Fat must be positive'],
  },
  fiber: {
    type: Number,
    default: 0,
    min: [0, 'Fiber must be positive'],
  },
  sugar: {
    type: Number,
    default: 0,
    min: [0, 'Sugar must be positive'],
  },
  sodium: {
    type: Number,
    default: 0,
    min: [0, 'Sodium must be positive'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  mealDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
mealSchema.index({ user: 1, mealDate: -1 });
mealSchema.index({ user: 1, mealType: 1 });

const Meal = mongoose.model('Meal', mealSchema);
export default Meal;
