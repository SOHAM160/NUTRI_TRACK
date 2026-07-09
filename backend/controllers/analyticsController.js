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

  // Helper: get local YYYY-MM-DD string to avoid UTC timezone mismatch
  const toLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum);
  startDate.setHours(0, 0, 0, 0);

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: startDate },
  }).sort('mealDate');

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysNum);

  const previousMeals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: previousStartDate, $lt: startDate },
  });

  // Daily breakdown
  const dailyData = {};
  for (let i = 0; i < daysNum; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (daysNum - 1 - i));
    const key = toLocalDateString(date);
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
    const key = toLocalDateString(new Date(meal.mealDate));
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

  // Generate Intelligent Insights
  const insights = [];
  const goals = req.user.nutritionGoals;

  if (goals) {
    // 1. Protein Intake Check
    if (averages.protein < goals.protein) {
      const diff = Math.round(((goals.protein - averages.protein) / goals.protein) * 100);
      if (diff > 0) insights.push({ type: 'warning', icon: 'Beef', text: `Protein intake is ${diff}% below your daily target on average.` });
    } else if (averages.protein > 0) {
      insights.push({ type: 'success', icon: 'Beef', text: `Great job! You are perfectly meeting your daily protein target.` });
    }

    // 2. Calorie Adherence
    if (averages.calories > goals.calories) {
      const diff = Math.round(((averages.calories - goals.calories) / goals.calories) * 100);
      if (diff > 0) insights.push({ type: 'danger', icon: 'Flame', text: `You exceeded your daily calorie goal by ${diff}% on average.` });
    }
    
    // 3. Healthiest Day (Closest to calorie goal)
    let bestDay = null;
    let smallestDiff = Infinity;
    
    dailyArray.forEach(d => {
      if (d.calories > 0) {
        const diff = Math.abs(d.calories - goals.calories);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestDay = d.date;
        }
      }
    });

    if (bestDay) {
      // Create a local date string for display (ignoring UTC issue for display logic)
      const [y, m, d] = bestDay.split('-');
      const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      insights.push({ type: 'success', icon: 'Award', text: `Your healthiest balance this period was on ${formattedDate}.` });
    }
  }

  // 4. Missing Breakfasts
  const datesWithBreakfast = new Set(meals.filter(m => m.mealType === 'Breakfast').map(m => toLocalDateString(new Date(m.mealDate))));
  const skippedBreakfastDays = daysNum - datesWithBreakfast.size;
  if (skippedBreakfastDays > 0 && datesWithBreakfast.size > 0) {
    insights.push({ type: 'info', icon: 'Coffee', text: `You missed logging breakfast on ${skippedBreakfastDays} day${skippedBreakfastDays > 1 ? 's' : ''}. Consistent mornings help metabolism!` });
  } else if (datesWithBreakfast.size === 0 && meals.length > 0) {
    insights.push({ type: 'info', icon: 'Coffee', text: `You haven't logged any breakfasts this period.` });
  }

  // 5. Compare Breakfast Trends
  const prevBreakfasts = previousMeals.filter(m => m.mealType === 'Breakfast');
  const prevBreakfastAvg = prevBreakfasts.length > 0 
    ? prevBreakfasts.reduce((sum, m) => sum + m.calories, 0) / prevBreakfasts.length 
    : 0;
  
  const currBreakfasts = meals.filter(m => m.mealType === 'Breakfast');
  const currBreakfastAvg = currBreakfasts.length > 0 
    ? currBreakfasts.reduce((sum, m) => sum + m.calories, 0) / currBreakfasts.length 
    : 0;

  if (prevBreakfastAvg > 0 && currBreakfastAvg > 0) {
    const percentChange = Math.round(((currBreakfastAvg - prevBreakfastAvg) / prevBreakfastAvg) * 100);
    if (percentChange > 5) {
      insights.push({ type: 'warning', icon: 'TrendingUp', text: `Average breakfast calories increased by ${percentChange}% compared to the previous period.` });
    } else if (percentChange < -5) {
      insights.push({ type: 'success', icon: 'TrendingDown', text: `Average breakfast calories decreased by ${Math.abs(percentChange)}% compared to the previous period.` });
    }
  }
  
  // 6. Check Sodium (Mock Goal as user didn't have explicit sodium goal, use FDA guideline 2300mg)
  const totalSodium = dailyArray.reduce((sum, d) => {
    // We didn't aggregate sodium in dailyArray, so calculate it directly from meals
    return sum; // Handled below
  }, 0);
  
  const totalSodiumFromMeals = meals.reduce((sum, m) => sum + (m.sodium || 0), 0);
  const activeDaysForSodium = dailyArray.filter(d => d.mealCount > 0).length || 1;
  const avgSodium = Math.round(totalSodiumFromMeals / activeDaysForSodium);
  
  if (avgSodium > 2300) {
    const excess = Math.round(((avgSodium - 2300) / 2300) * 100);
    insights.push({ type: 'danger', icon: 'AlertTriangle', text: `You exceeded the recommended daily sodium (2300mg) by ${excess}% on average.` });
  }

  res.json({
    success: true,
    daily: dailyArray,
    mealTypeDistribution,
    weeklySummary,
    insights,
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
