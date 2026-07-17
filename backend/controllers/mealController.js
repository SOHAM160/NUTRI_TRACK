import Meal from '../models/Meal.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { sendGoalReachedEmail } from '../utils/emailService.js';
import { evaluateStreak } from './streakController.js';
import { getTodayRange } from '../utils/timezone.js';

const checkDailyGoals = async (userId, tz) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.nutritionGoals) return;

    const { today, tomorrow } = getTodayRange(tz);

    const meals = await Meal.find({
      user: userId,
      mealDate: { $gte: today, $lt: tomorrow },
    });

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const goals = user.nutritionGoals || {};
    const calGoal = goals.calories || 2000;
    const proGoal = goals.protein || 150;
    const carbGoal = goals.carbs || 250;
    const fatGoal = goals.fat || 70;

    const allGoalsProgress = [
      { name: 'Calories', current: totals.calories, target: calGoal, unit: 'kcal' },
      { name: 'Protein', current: totals.protein, target: proGoal, unit: 'g' },
      { name: 'Carbs', current: totals.carbs, target: carbGoal, unit: 'g' },
      { name: 'Fat', current: totals.fat, target: fatGoal, unit: 'g' },
    ];
    
    const completedGoals = allGoalsProgress.filter(g => g.current >= g.target);
    
    if (completedGoals.length > 0) {
      const lastNotified = user.lastGoalNotifiedDate;
      let alreadyNotifiedToday = false;
      
      if (lastNotified) {
        const notifiedDate = new Date(lastNotified);
        notifiedDate.setHours(0, 0, 0, 0);
        if (notifiedDate.getTime() === today.getTime()) {
           alreadyNotifiedToday = true;
        }
      }

      if (!alreadyNotifiedToday) {
        await sendGoalReachedEmail(user.email, user.name, completedGoals, allGoalsProgress);
        user.lastGoalNotifiedDate = new Date();
        await user.save();
      }
    }
  } catch (error) {
    console.error('Error checking daily goals:', error);
  }
};

/**
 * @desc    Create a meal
 * @route   POST /api/meals
 * @access  Private
 */
export const createMeal = asyncHandler(async (req, res) => {
  const { mealName, mealType, calories, protein, carbs, fat, fiber, sugar, sodium, notes, mealDate } = req.body;

  if (!mealName || !mealType || calories === undefined) {
    throw new ApiError(400, 'Meal name, type, and calories are required');
  }

  let imageUrl = req.body.existingImage || '';
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'nutritrack/meals');
    imageUrl = result.secure_url;
  }

  const meal = await Meal.create({
    user: req.user._id,
    mealName,
    mealType,
    image: imageUrl,
    calories: Number(calories),
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    fiber: Number(fiber) || 0,
    sugar: Number(sugar) || 0,
    sodium: Number(sodium) || 0,
    notes,
    mealDate: mealDate || new Date(),
  });

  // Check goals asynchronously
  checkDailyGoals(req.user._id, req.headers['x-timezone']);

  // Evaluate streak
  await evaluateStreak(req.user._id);

  res.status(201).json({
    success: true,
    message: 'Meal created successfully',
    meal,
  });
});

/**
 * @desc    Get all meals for user (with pagination, search, filter)
 * @route   GET /api/meals
 * @access  Private
 */
export const getMeals = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    mealName,
    notes,
    mealType,
    startDate,
    endDate,
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    sort = '-mealDate',
  } = req.query;

  const query = { user: req.user._id };

  // Search by meal name
  const foodSearch = search || mealName;
  if (foodSearch) {
    query.mealName = { $regex: foodSearch, $options: 'i' };
  }

  // Search by notes
  if (notes) {
    query.notes = { $regex: notes, $options: 'i' };
  }

  // Filter by meal type
  if (mealType) {
    query.mealType = mealType;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.mealDate = {};
    if (startDate) query.mealDate.$gte = new Date(startDate);
    if (endDate) query.mealDate.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  // Filter by Calories range
  if (minCalories || maxCalories) {
    query.calories = {};
    if (minCalories) {
      const min = Number(minCalories);
      if (!isNaN(min)) query.calories.$gte = min;
    }
    if (maxCalories) {
      const max = Number(maxCalories);
      if (!isNaN(max)) query.calories.$lte = max;
    }
    if (Object.keys(query.calories).length === 0) {
      delete query.calories;
    }
  }

  // Filter by Protein range
  if (minProtein || maxProtein) {
    query.protein = {};
    if (minProtein) {
      const min = Number(minProtein);
      if (!isNaN(min)) query.protein.$gte = min;
    }
    if (maxProtein) {
      const max = Number(maxProtein);
      if (!isNaN(max)) query.protein.$lte = max;
    }
    if (Object.keys(query.protein).length === 0) {
      delete query.protein;
    }
  }

  const total = await Meal.countDocuments(query);
  const meals = await Meal.find(query)
    .sort(sort)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({
    success: true,
    meals,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * @desc    Get single meal
 * @route   GET /api/meals/:id
 * @access  Private
 */
export const getMeal = asyncHandler(async (req, res) => {
  const meal = await Meal.findOne({ _id: req.params.id, user: req.user._id });

  if (!meal) {
    throw new ApiError(404, 'Meal not found');
  }

  res.json({ success: true, meal });
});

/**
 * @desc    Update a meal
 * @route   PUT /api/meals/:id
 * @access  Private
 */
export const updateMeal = asyncHandler(async (req, res) => {
  let meal = await Meal.findOne({ _id: req.params.id, user: req.user._id });

  if (!meal) {
    throw new ApiError(404, 'Meal not found');
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (meal.image) {
      await deleteFromCloudinary(meal.image);
    }
    const result = await uploadToCloudinary(req.file.buffer, 'nutritrack/meals');
    req.body.image = result.secure_url;
  }

  // Convert numeric fields
  const numericFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
  numericFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.body[field] = Number(req.body[field]);
    }
  });

  meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Check goals asynchronously
  checkDailyGoals(req.user._id, req.headers['x-timezone']);

  // Evaluate streak
  await evaluateStreak(req.user._id);

  res.json({
    success: true,
    message: 'Meal updated successfully',
    meal,
  });
});

/**
 * @desc    Delete a meal
 * @route   DELETE /api/meals/:id
 * @access  Private
 */
export const deleteMeal = asyncHandler(async (req, res) => {
  const meal = await Meal.findOne({ _id: req.params.id, user: req.user._id });

  if (!meal) {
    throw new ApiError(404, 'Meal not found');
  }

  // Delete image from Cloudinary
  if (meal.image) {
    await deleteFromCloudinary(meal.image);
  }

  await meal.deleteOne();

  // Re-evaluate streak after deletion
  await evaluateStreak(req.user._id);

  res.json({ success: true, message: 'Meal deleted successfully' });
});

/**
 * @desc    Get today's meals
 * @route   GET /api/meals/today
 * @access  Private
 */
export const getTodayMeals = asyncHandler(async (req, res) => {
  const { today, tomorrow } = getTodayRange(req.headers['x-timezone']);

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: today, $lt: tomorrow },
  }).sort('-mealDate');

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  res.json({
    success: true,
    meals,
    totals,
    count: meals.length,
  });
});

/**
 * @desc    Get meal autocomplete suggestions from history
 * @route   GET /api/meals/suggestions?query=...
 * @access  Private
 */
export const getMealSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  // Find most recent meals matching query, aggregate by mealName (case-insensitive)
  const suggestions = await Meal.aggregate([
    {
      $match: {
        user: req.user._id,
        mealName: { $regex: query, $options: 'i' }
      }
    },
    { $sort: { mealDate: -1 } },
    {
      $group: {
        _id: { $toLower: "$mealName" },
        mealName: { $first: "$mealName" },
        mealType: { $first: "$mealType" },
        calories: { $first: "$calories" },
        protein: { $first: "$protein" },
        carbs: { $first: "$carbs" },
        fat: { $first: "$fat" },
        fiber: { $first: "$fiber" },
        sugar: { $first: "$sugar" },
        sodium: { $first: "$sodium" },
        image: { $first: "$image" }
      }
    },
    { $limit: 5 }
  ]);

  // Rename _id as it was used for grouping
  const formattedSuggestions = suggestions.map(s => {
    const { _id, ...rest } = s;
    return rest;
  });

  res.json({ success: true, suggestions: formattedSuggestions });
});
