import GutHealthLog from '../models/GutHealthLog.js';
import Meal from '../models/Meal.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const PROBIOTIC_KEYWORDS = ['yogurt', 'kefir', 'kombucha', 'sauerkraut', 'kimchi', 'miso', 'tempeh', 'pickles'];
const PREBIOTIC_KEYWORDS = ['garlic', 'onion', 'leek', 'asparagus', 'banana', 'oat', 'apple', 'flaxseed', 'chia', 'barley', 'bean', 'lentil'];

const toLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const logSymptoms = asyncHandler(async (req, res) => {
  const { logDate, symptoms, notes } = req.body;

  if (!logDate || !symptoms) {
    throw new ApiError(400, 'Date and symptoms are required');
  }

  const dateObj = new Date(logDate);
  dateObj.setHours(0, 0, 0, 0);
  const nextDate = new Date(dateObj);
  nextDate.setDate(nextDate.getDate() + 1);

  // Fetch meals for the day
  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: dateObj, $lt: nextDate }
  });

  let fiberCons = 0;
  let probioticCons = 0;
  let prebioticCons = 0;

  meals.forEach(meal => {
    fiberCons += (meal.fiber || 0);
    const mealNameLower = meal.mealName.toLowerCase();
    
    if (PROBIOTIC_KEYWORDS.some(kw => mealNameLower.includes(kw))) {
      probioticCons += 1;
    }
    if (PREBIOTIC_KEYWORDS.some(kw => mealNameLower.includes(kw))) {
      prebioticCons += 1;
    }
  });

  // Calculate score
  let score = 100;
  
  // Deduct based on symptoms
  const hasSymptoms = symptoms.length > 0 && symptoms[0].type !== 'none';
  if (hasSymptoms) {
    symptoms.forEach(s => {
      score -= (s.severity * 3); // -3 per severity point
    });
  }

  // Bonus for fiber, max +10
  const fiberTarget = 30; // standard 30g goal
  const fiberScore = Math.min(10, Math.round((fiberCons / fiberTarget) * 10));
  score += fiberScore;

  // Bonus for pro/prebiotics, max +10
  score += (Math.min(2, probioticCons) * 2.5);
  score += (Math.min(2, prebioticCons) * 2.5);

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Upsert the log for the day
  let gutLog = await GutHealthLog.findOne({
    user: req.user._id,
    logDate: { $gte: dateObj, $lt: nextDate }
  });

  if (gutLog) {
    gutLog.symptoms = symptoms;
    gutLog.notes = notes;
    gutLog.gutScore = score;
    gutLog.metrics = { fiberCons, probioticCons, prebioticCons };
    await gutLog.save();
  } else {
    gutLog = await GutHealthLog.create({
      user: req.user._id,
      logDate: dateObj,
      symptoms,
      notes,
      gutScore: score,
      metrics: { fiberCons, probioticCons, prebioticCons }
    });
  }

  res.json({ success: true, log: gutLog });
});

export const getGutHealthHistory = asyncHandler(async (req, res) => {
  const logs = await GutHealthLog.find({ user: req.user._id }).sort('-logDate').limit(14);
  res.json({ success: true, logs });
});

export const getGutHealthInsights = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Last 7 days
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 7);
  periodStart.setHours(0, 0, 0, 0);

  const logs = await GutHealthLog.find({
    user: req.user._id,
    logDate: { $gte: periodStart }
  }).sort('logDate');

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: periodStart }
  }).sort('mealDate');

  if (logs.length === 0 && meals.length === 0) {
    throw new ApiError(400, 'Not enough data to generate insights.');
  }

  // Format context
  const mealContext = meals.map(m => `Date: ${toLocalDateString(new Date(m.mealDate))} - ${m.mealType}: ${m.mealName} (Fiber: ${m.fiber}g)`).join('\n');
  const symptomContext = logs.map(l => `Date: ${toLocalDateString(new Date(l.logDate))} - Symptoms: ${l.symptoms.map(s => s.type + '(' + s.severity + '/10)').join(', ')} - Notes: ${l.notes}`).join('\n');

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ApiError(500, 'AI service not configured');

  const prompt = `You are a specialized Gut Health & Digestive Wellness AI coach for NutriTrack.
Analyze the user's last 7 days of meals and digestive symptoms.
Identify potential correlations between foods eaten and symptoms (e.g., bloating after eating dairy, or improved digestion after fiber).
Provide 3-5 specific, actionable insights, highlighting foods to increase and foods to avoid based on their actual logs.
Format using markdown (**bolding**, bullet points). Be professional and deeply analytical.

Meals Log:
${mealContext || 'None.'}

Symptoms Log:
${symptomContext || 'None.'}`;

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

  res.json({ success: true, insights: aiInsights });
});
