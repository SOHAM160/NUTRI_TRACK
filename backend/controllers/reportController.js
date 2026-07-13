import Report from '../models/Report.js';
import User from '../models/User.js';
import Meal from '../models/Meal.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

export const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.body; // 'Weekly' or 'Monthly'
  if (!['Weekly', 'Monthly'].includes(type)) {
    throw new ApiError(400, 'Invalid report type');
  }

  const daysNum = type === 'Weekly' ? 7 : 30;
  const user = await User.findById(req.user._id);

  const periodEnd = new Date();
  periodEnd.setHours(23, 59, 59, 999);
  
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - daysNum);
  periodStart.setHours(0, 0, 0, 0);

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: periodStart, $lte: periodEnd },
  });

  // Calculate stats
  const activeDaysSet = new Set(meals.map(m => new Date(m.mealDate).toISOString().split('T')[0]));
  const activeDays = Math.max(1, activeDaysSet.size);
  const consistency = Math.round((activeDaysSet.size / daysNum) * 100);

  let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
  const typeCounts = { Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };
  
  meals.forEach(m => {
    totalCal += m.calories;
    totalPro += m.protein;
    totalCarb += m.carbs;
    totalFat += m.fat;
    if (m.mealType in typeCounts) {
      typeCounts[m.mealType]++;
    }
  });

  const avgCalories = Math.round(totalCal / activeDays);
  const avgProtein = Math.round(totalPro / activeDays);
  const avgCarbs = Math.round(totalCarb / activeDays);
  const avgFat = Math.round(totalFat / activeDays);

  const goals = user.nutritionGoals || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
  const percentDiffCal = (Math.abs(avgCalories - goals.calories) / goals.calories) * 100;
  const goalAdherence = Math.round(100 - percentDiffCal);
  const finalGoalAdherence = Math.max(0, Math.min(100, goalAdherence));

  let mostConsumedType = 'None';
  let mostSkippedType = 'None';
  let minCount = Infinity, maxCount = -1;
  const types = Object.keys(typeCounts);
  types.forEach(t => {
    if(typeCounts[t] > maxCount) { maxCount = typeCounts[t]; mostConsumedType = t; }
    if(typeCounts[t] < minCount) { minCount = typeCounts[t]; mostSkippedType = t; }
  });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError(500, 'AI service not configured');

  const prompt = `You are NutriTrack AI, an expert nutrition coach analyzing a ${type.toLowerCase()} report.
Please provide personalized insights, identify eating patterns, point out nutritional imbalances, and recommend improvements based on the user's goals.
Address the user directly in a professional, encouraging tone. Format strictly with markdown. Do not include markdown code block syntax (like \`\`\`markdown), just raw markdown text.

User Profile:
Goal: ${user.goal || 'Not specified'}
Report Type: ${type} (${daysNum} days)
Consistency (days tracking): ${consistency}%
Avg Calories: ${avgCalories} (Target: ${goals.calories})
Avg Protein: ${avgProtein}g (Target: ${goals.protein}g)
Avg Carbs: ${avgCarbs}g (Target: ${goals.carbs}g)
Avg Fat: ${avgFat}g (Target: ${goals.fat}g)
Overall Goal Adherence: ${finalGoalAdherence}%
Most consumed meal: ${mostConsumedType}, Most skipped meal: ${mostSkippedType}
`;

  const reqGroq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });

  if (!reqGroq.ok) throw new ApiError(502, 'AI service returned an error');
  const data = await reqGroq.json();
  const aiInsights = data.choices?.[0]?.message?.content || 'No insights generated.';

  const report = await Report.create({
    user: req.user._id,
    type,
    periodStart,
    periodEnd,
    metrics: {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      goalAdherence: finalGoalAdherence,
      consistency,
      mostConsumedType,
      mostSkippedType
    },
    aiInsights
  });

  res.status(201).json({ success: true, report });
});

export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, reports });
});
