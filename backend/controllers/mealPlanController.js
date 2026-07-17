import MealPlan from '../models/MealPlan.js';
import User from '../models/User.js';
import Meal from '../models/Meal.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { getTodayRange } from '../utils/timezone.js';

export const generatePlan = asyncHandler(async (req, res) => {
  const { dietPreference, mealsToGenerate } = req.body; // e.g. ['Breakfast', 'Lunch']
  
  if (!dietPreference || !mealsToGenerate || mealsToGenerate.length === 0) {
    throw new ApiError(400, 'Diet preference and at least one meal to generate are required');
  }

  const user = await User.findById(req.user._id);
  
  const { today, tomorrow } = getTodayRange(req.headers['x-timezone']);

  const todayMeals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: today, $lt: tomorrow },
  });

  const todayTotals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goals = user.nutritionGoals || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
  const caloriesRemaining = Math.max(0, goals.calories - todayTotals.calories);
  const proteinRemaining = Math.max(0, goals.protein - todayTotals.protein);
  const carbsRemaining = Math.max(0, goals.carbs - todayTotals.carbs);
  const fatRemaining = Math.max(0, goals.fat - todayTotals.fat);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError(500, 'AI service is not configured');

  const medConds = user.healthPreferences?.medicalConditions?.length > 0 ? user.healthPreferences.medicalConditions.join(', ') : 'None';
  const allergies = user.healthPreferences?.allergies?.length > 0 ? user.healthPreferences.allergies.join(', ') : 'None';
  const diets = user.healthPreferences?.dietaryRestrictions?.length > 0 ? user.healthPreferences.dietaryRestrictions.join(', ') : 'None';

  const prompt = `You are an expert AI meal planner.
User Profile: Age ${user.age || 'N/A'}, Height ${user.height || 'N/A'}cm, Weight ${user.weight || 'N/A'}kg, Activity Level ${user.activityLevel || 'N/A'}, Fitness Goal ${user.goal || 'N/A'}.
Health Needs: Medical Conditions: ${medConds}, Allergies: ${allergies}, Diet Restrictions: ${diets}. NEVER recommend foods violating allergies or medical constraints!
Diet Preference: ${dietPreference}
Total Target Macros: Cals: ${goals.calories}, Protein: ${goals.protein}g, Carbs: ${goals.carbs}g, Fat: ${goals.fat}g.
Already consumed today: Cals: ${todayTotals.calories}, Protein: ${todayTotals.protein}g, Carbs: ${todayTotals.carbs}g, Fat: ${todayTotals.fat}g.
Remaining for today: Cals: ${caloriesRemaining}, Protein: ${proteinRemaining}g, Carbs: ${carbsRemaining}g, Fat: ${fatRemaining}g.

Please generate a meal plan for the following meals: ${mealsToGenerate.join(', ')}.
Distribute the remaining macros roughly evenly or appropriately among the requested meals.
Return ONLY valid JSON format. Do not use Markdown, do not include \`\`\`json blocks, just raw JSON.
The JSON must be an array of objects. Each object must have:
"mealType" (string, must exactly match one of the requested meals),
"mealName" (string),
"calories" (number),
"protein" (number),
"carbs" (number),
"fat" (number),
"ingredients" (array of strings).
Example: [{"mealType": "Breakfast", "mealName": "Oatmeal", "calories": 300, "protein": 10, "carbs": 50, "fat": 5, "ingredients": ["oats 50g", "almond milk 200ml"]}]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // low for json
        max_tokens: 1024,
      }),
    });

    if (!response.ok) throw new ApiError(502, 'AI service returned an error.');

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '[]';
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    let generatedMeals = [];
    try {
      generatedMeals = JSON.parse(aiResponse);
    } catch(e) {
      // console.log('AI Response Parsing failed. Raw:', aiResponse);
      throw new ApiError(500, 'Failed to parse AI generated meal plan');
    }

    res.json({ success: true, meals: generatedMeals });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Plan Gen Error:', error);
    throw new ApiError(502, 'Failed to generate meal plan. Please try again.');
  }
});

export const regenerateSingleMeal = asyncHandler(async (req, res) => {
  const { dietPreference, mealType, targetCalories, targetProtein, targetCarbs, targetFat } = req.body;

  if (!dietPreference || !mealType) {
    throw new ApiError(400, 'Diet preference and meal type are required');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError(500, 'AI service is not configured');

  const user = await User.findById(req.user._id);
  const medConds = user.healthPreferences?.medicalConditions?.length > 0 ? user.healthPreferences.medicalConditions.join(', ') : 'None';
  const allergies = user.healthPreferences?.allergies?.length > 0 ? user.healthPreferences.allergies.join(', ') : 'None';
  const diets = user.healthPreferences?.dietaryRestrictions?.length > 0 ? user.healthPreferences.dietaryRestrictions.join(', ') : 'None';

  const prompt = `You are an expert AI meal planner.
Health Needs: Medical Conditions: ${medConds}, Allergies: ${allergies}, Diet Restrictions: ${diets}. NEVER recommend foods violating allergies or medical constraints!
Diet Preference: ${dietPreference}
Target Macros for this meal: Cals: ${targetCalories}, Protein: ${targetProtein}g, Carbs: ${targetCarbs}g, Fat: ${targetFat}g.

Please generate a single alternative meal for: ${mealType} that matches the target macros as closely as possible.
Return ONLY valid JSON format. Do not use Markdown, do not include \`\`\`json blocks, just raw JSON.
The JSON must be a single object (not an array) with:
"mealType" (string, exact match: ${mealType}),
"mealName" (string),
"calories" (number),
"protein" (number),
"carbs" (number),
"fat" (number),
"ingredients" (array of strings).`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) throw new ApiError(502, 'AI service returned an error.');

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '{}';
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    let meal = {};
    try {
      meal = JSON.parse(aiResponse);
    } catch(e) {
      throw new ApiError(500, 'Failed to parse AI generated single meal');
    }

    res.json({ success: true, meal });
  } catch(error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'Failed to regenerate meal. Please try again.');
  }
});

export const savePlan = asyncHandler(async (req, res) => {
  const { dietPreference, meals } = req.body;
  if (!meals || meals.length === 0) {
    throw new ApiError(400, 'Meals data is required');
  }

  const plan = await MealPlan.create({
    user: req.user._id,
    dietPreference: dietPreference || 'Standard',
    meals
  });

  res.status(201).json({ success: true, plan });
});

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await MealPlan.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, plans });
});
