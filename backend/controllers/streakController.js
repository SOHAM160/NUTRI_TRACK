import Meal from '../models/Meal.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';


/**
 * Check if a day's intake meets the user goals (within ±10% tolerance)
 */
const isDaySuccessful = (intake, goals) => {
  const tolerance = 0.10;
  const checks = [
    { current: intake.calories, target: goals.calories || 2000 },
    { current: intake.protein,  target: goals.protein  || 150  },
    { current: intake.carbs,    target: goals.carbs    || 250  },
    { current: intake.fat,      target: goals.fat      || 70   },
  ];

  return checks.every(({ current, target }) => {
    const lower = target * (1 - tolerance);
    return current >= lower;
  });
};

/**
 * Calculate daily totals for a specific date
 */
const getDailyTotals = async (userId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const meals = await Meal.find({
    user: userId,
    mealDate: { $gte: start, $lt: end },
  });

  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
  );
};

/**
 * Normalize a date to midnight for consistent comparison
 */
const toMidnight = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Initialize (or re-initialize) a user's streak by parsing all historical meal data.
 * Useful for retroactive streak tracking when the feature is first added.
 */
export const initHistoricalStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return user;

  const allMeals = await Meal.find({ user: userId }).sort('mealDate');
  
  if (allMeals.length === 0) {
    if (!user.streak) user.streak = {};
    user.streak.isInitialized = true;
    await user.save();
    return user;
  }

  // Group meals by day
  const dailyTotals = {};
  for (const meal of allMeals) {
    const d = toMidnight(new Date(meal.mealDate));
    const dateKey = d.getTime();
    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0, date: d };
    }
    dailyTotals[dateKey].calories += meal.calories;
    dailyTotals[dateKey].protein += (meal.protein || 0);
    dailyTotals[dateKey].carbs += (meal.carbs || 0);
    dailyTotals[dateKey].fat += (meal.fat || 0);
    dailyTotals[dateKey].mealCount += 1;
  }

  const dates = Object.values(dailyTotals).sort((a, b) => a.date - b.date);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let lastSuccessDate = null;
  const goals = user.nutritionGoals || {};

  for (let i = 0; i < dates.length; i++) {
    const day = dates[i];
    if (isDaySuccessful(day, goals)) {
       if (lastSuccessDate) {
         const diffDays = Math.floor((day.date - lastSuccessDate) / (1000 * 60 * 60 * 24));
         if (diffDays === 1) {
           currentStreak++;
         } else if (diffDays > 1) {
           currentStreak = 1;
         }
       } else {
         currentStreak = 1;
       }
       lastSuccessDate = day.date;
       if (currentStreak > longestStreak) longestStreak = currentStreak;
    }
  }

  // Check if current streak broke recently
  const today = toMidnight(new Date());
  if (lastSuccessDate) {
     const diffDays = Math.floor((today - lastSuccessDate) / (1000 * 60 * 60 * 24));
     if (diffDays > 1) {
       currentStreak = 0; // reset
     }
  }

  if (!user.streak) user.streak = {};
  user.streak.current = currentStreak;
  user.streak.longest = longestStreak;
  user.streak.lastSuccessDate = lastSuccessDate;
  user.streak.isInitialized = true;

  await user.save();
  return user;
};

/**
 * Evaluate today's streak.
 * Called internally after meal create/update/delete.
 */
export const evaluateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.nutritionGoals) return;

    const today = toMidnight(new Date());
    const todayTotals = await getDailyTotals(userId, today);

    // Need at least 1 meal to evaluate
    if (todayTotals.mealCount === 0) {
      return { newAchievements: [] };
    }

    const goalsMet = isDaySuccessful(todayTotals, user.nutritionGoals);

    if (!goalsMet) {
      // If user had a streak going and they're failing today, keep it until
      // the day actually ends (don't punish mid-day). Only reset if lastSuccessDate
      // is more than 1 day in the past.
      if (user.streak.lastSuccessDate) {
        const lastSuccess = toMidnight(new Date(user.streak.lastSuccessDate));
        const diffDays = Math.floor((today - lastSuccess) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          user.streak.current = 0;
          await user.save();
        }
      }
      return;
    }

    // Goals are met today
    const lastSuccess = user.streak.lastSuccessDate
      ? toMidnight(new Date(user.streak.lastSuccessDate))
      : null;

    if (lastSuccess) {
      const diffDays = Math.floor((today - lastSuccess) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already evaluated today, no change needed (unless streak was 0)
        if (user.streak.current === 0) {
          user.streak.current = 1;
        }
      } else if (diffDays === 1) {
        // Consecutive day — extend streak
        user.streak.current += 1;
      } else {
        // Gap in streak — reset to 1
        user.streak.current = 1;
      }
    } else {
      // First ever success
      user.streak.current = 1;
    }

    user.streak.lastSuccessDate = today;

    // Update longest streak
    if (user.streak.current > user.streak.longest) {
      user.streak.longest = user.streak.current;
    }

    user.streak.isInitialized = true;
    await user.save();

  } catch (error) {
    console.error('Error evaluating streak:', error);
  }
};

/**
 * @desc    Get streak & achievements data for dashboard
 * @route   GET /api/analytics/streaks
 * @access  Private
 */
export const getStreakData = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id);

  // Retroactively calculate streak the first time if not initialized
  if (!user.streak || !user.streak.isInitialized) {
    user = await initHistoricalStreak(user._id);
  }

  // Also compute today's goal progress for the response
  const today = toMidnight(new Date());
  const todayTotals = await getDailyTotals(req.user._id, today);
  const goals = user.nutritionGoals;

  const goalProgress = {
    calories: { current: todayTotals.calories, target: goals?.calories || 2000 },
    protein:  { current: todayTotals.protein,  target: goals?.protein  || 150  },
    carbs:    { current: todayTotals.carbs,    target: goals?.carbs    || 250  },
    fat:      { current: todayTotals.fat,      target: goals?.fat      || 70   },
  };

  // Check if today is on-track (within ±10%)
  const todayOnTrack = todayTotals.mealCount > 0
    ? isDaySuccessful(todayTotals, goals || {})
    : false;

  res.json({
    success: true,
    streak: {
      current: user.streak?.current || 0,
      longest: user.streak?.longest || 0,
      lastSuccessDate: user.streak?.lastSuccessDate || null,
    },
    goalProgress,
    todayOnTrack,
  });
});
