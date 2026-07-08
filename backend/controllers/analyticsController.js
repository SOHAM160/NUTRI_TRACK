import Meal from '../models/Meal.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get analytics data
 * @route   GET /api/analytics
 * @access  Private
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const daysNum = Number(days);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);
  startDate.setHours(0, 0, 0, 0);

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: startDate },
  }).sort('mealDate');

  // Daily breakdown
  const dailyData = {};
  for (let i = 0; i < daysNum; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysNum - 1 - i));
    const key = date.toISOString().split('T')[0];
    dailyData[key] = {
      date: key,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealCount: 0,
    };
  }

  meals.forEach((meal) => {
    const key = new Date(meal.mealDate).toISOString().split('T')[0];
    if (dailyData[key]) {
      dailyData[key].calories += meal.calories;
      dailyData[key].protein += meal.protein;
      dailyData[key].carbs += meal.carbs;
      dailyData[key].fat += meal.fat;
      dailyData[key].mealCount += 1;
    }
  });

  const dailyArray = Object.values(dailyData);

  // Meal type distribution
  const mealTypeDistribution = await Meal.aggregate([
    {
      $match: {
        user: req.user._id,
        mealDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$mealType',
        count: { $sum: 1 },
        totalCalories: { $sum: '$calories' },
      },
    },
  ]);

  // Averages
  const totalCalories = dailyArray.reduce((sum, d) => sum + d.calories, 0);
  const totalProtein = dailyArray.reduce((sum, d) => sum + d.protein, 0);
  const totalCarbs = dailyArray.reduce((sum, d) => sum + d.carbs, 0);
  const totalFat = dailyArray.reduce((sum, d) => sum + d.fat, 0);
  const activeDays = dailyArray.filter((d) => d.mealCount > 0).length || 1;

  const averages = {
    calories: Math.round(totalCalories / activeDays),
    protein: Math.round(totalProtein / activeDays),
    carbs: Math.round(totalCarbs / activeDays),
    fat: Math.round(totalFat / activeDays),
  };

  // Weekly summary
  const weeklySummary = {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalMeals: meals.length,
    averages,
  };

  res.json({
    success: true,
    daily: dailyArray,
    mealTypeDistribution,
    weeklySummary,
    period: daysNum,
  });
});

/**
 * @desc    Get dashboard summary
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  // Today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: today, $lt: tomorrow },
  });

  const todayTotals = todayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Weekly data (last 7 days)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekMeals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: weekStart },
  });

  const weeklyTotals = weekMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Recent meals (last 5)
  const recentMeals = await Meal.find({ user: req.user._id })
    .sort('-mealDate')
    .limit(5);

  res.json({
    success: true,
    today: {
      ...todayTotals,
      mealCount: todayMeals.length,
    },
    weekly: {
      ...weeklyTotals,
      mealCount: weekMeals.length,
      avgCalories: weekMeals.length > 0 ? Math.round(weeklyTotals.calories / 7) : 0,
    },
    recentMeals,
  });
});
