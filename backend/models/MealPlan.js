import mongoose from 'mongoose';

const mealItemSchema = new mongoose.Schema({
  mealType: { type: String, required: true }, // Breakfast, Lunch, Dinner, Snack
  mealName: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  ingredients: [{ type: String }]
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  dietPreference: {
    type: String,
    required: true,
  },
  meals: [mealItemSchema]
}, { timestamps: true });

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
export default MealPlan;
