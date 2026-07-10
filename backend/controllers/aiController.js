import Meal from '../models/Meal.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * Helper: get local YYYY-MM-DD string
 */
const toLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Build a rich system prompt from the user's real data
 */
const buildSystemPrompt = async (userId) => {
  const user = await User.findById(userId);

  // Today's meals
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMeals = await Meal.find({
    user: userId,
    mealDate: { $gte: today, $lt: tomorrow },
  });

  // This week's meals
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekMeals = await Meal.find({
    user: userId,
    mealDate: { $gte: weekStart },
  }).sort('-mealDate');

  // Aggregated context
  const todayTotals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      sodium: acc.sodium + (m.sodium || 0),
      sugar: acc.sugar + (m.sugar || 0),
      fiber: acc.fiber + (m.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, fiber: 0 }
  );

  const todayMealNames = todayMeals.map(
    (m) => `${m.mealType}: ${m.mealName} (${m.calories} kcal, P:${m.protein}g, C:${m.carbs}g, F:${m.fat}g)`
  );

  const loggedTypes = [...new Set(todayMeals.map((m) => m.mealType))];
  const allTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const missingTypes = allTypes.filter((t) => !loggedTypes.includes(t));

  const weekTotals = weekMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const daysWithMeals = new Set(weekMeals.map((m) => toLocalDateString(new Date(m.mealDate)))).size || 1;
  const weekAvg = {
    calories: Math.round(weekTotals.calories / daysWithMeals),
    protein: Math.round(weekTotals.protein / daysWithMeals),
    carbs: Math.round(weekTotals.carbs / daysWithMeals),
    fat: Math.round(weekTotals.fat / daysWithMeals),
  };

  const recentMealNames = [...new Set(weekMeals.map((m) => m.mealName))].slice(0, 15);

  const goals = user.nutritionGoals || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
  const caloriesRemaining = Math.max(0, goals.calories - todayTotals.calories);
  const proteinRemaining = Math.max(0, goals.protein - todayTotals.protein);

  return `You are NutriTrack AI — a world-class, data-driven personal nutrition coach embedded in the NutriTrack app. You have direct access to the user's real-time meal data shown below.

═══ USER PROFILE ═══
Name: ${user.name}
Goal: ${user.goal || 'Not specified'}
Age: ${user.age || 'N/A'} | Gender: ${user.gender || 'N/A'}
Height: ${user.height ? user.height + ' cm' : 'N/A'} | Weight: ${user.weight ? user.weight + ' kg' : 'N/A'}
Activity Level: ${user.activityLevel || 'N/A'}

═══ DAILY NUTRITION TARGETS ═══
Calories: ${goals.calories} kcal | Protein: ${goals.protein}g | Carbs: ${goals.carbs}g | Fat: ${goals.fat}g

═══ TODAY'S INTAKE (${toLocalDateString(new Date())}) ═══
Meals logged: ${todayMeals.length}
${todayMealNames.length > 0 ? todayMealNames.join('\n') : '(No meals logged yet today)'}

Totals → Calories: ${todayTotals.calories} kcal | Protein: ${todayTotals.protein}g | Carbs: ${todayTotals.carbs}g | Fat: ${todayTotals.fat}g | Sodium: ${todayTotals.sodium}mg | Sugar: ${todayTotals.sugar}g | Fiber: ${todayTotals.fiber}g
Remaining → Calories: ${caloriesRemaining} kcal | Protein: ${proteinRemaining}g
Meal types not yet logged today: ${missingTypes.length > 0 ? missingTypes.join(', ') : 'All meal types logged'}

═══ WEEKLY AVERAGES (last 7 days, ${daysWithMeals} active day${daysWithMeals > 1 ? 's' : ''}) ═══
Avg Calories: ${weekAvg.calories} kcal/day | Avg Protein: ${weekAvg.protein}g/day | Avg Carbs: ${weekAvg.carbs}g/day | Avg Fat: ${weekAvg.fat}g/day
Total meals this week: ${weekMeals.length}

═══ RECENT FOODS ═══
${recentMealNames.join(', ') || 'None'}

═══ INSTRUCTIONS ═══
1. Always ground your responses in the ACTUAL DATA above. Never make up numbers.
2. When recommending meals, factor in: remaining calories/macros, user's goal, meal types not yet logged, and their recent eating patterns.
3. Be specific with food suggestions (e.g., "200g grilled chicken breast with steamed broccoli" not just "eat more protein").
4. Use a warm, encouraging, professional tone. Be concise but thorough.
5. Format responses with markdown: use **bold** for emphasis, bullet points for lists, and clear structure.
6. If asked about a specific nutrient, compare it against their target and give actionable advice.
7. Never refuse to help or say you don't have data — you DO have their real data above.
8. If today has no meals logged, focus recommendations on what they should eat to meet their targets.`;
};

/**
 * Auto-generate a short title from the first user message
 */
const generateTitle = (message) => {
  const cleaned = message.replace(/[?!.]/g, '').trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.substring(0, 40).trim() + '...';
};

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Send a message in a chat (create new or continue existing)
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const aiChat = asyncHandler(async (req, res) => {
  const { message, chatId } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message is required');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'AI service is not configured');
  }

  // Find or create the chat
  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, user: req.user._id });
    if (!chat) throw new ApiError(404, 'Chat not found');
  } else {
    chat = new Chat({
      user: req.user._id,
      title: generateTitle(message),
      messages: [],
    });
  }

  // Add user message
  chat.messages.push({ role: 'user', content: message });

  // Build context
  const systemPrompt = await buildSystemPrompt(req.user._id);

  // Build conversation history for multi-turn (last 10 messages for context window)
  const recentMessages = chat.messages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    // Call Groq API
    console.log(`[AI SERVICE] Sending request to Groq API using key: ${apiKey.substring(0, 8)}...`);
    const startTime = Date.now();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      throw new ApiError(502, 'AI service returned an error. Please try again.');
    }

    const data = await response.json();
    const elapsedTime = Date.now() - startTime;
    
    console.log(`[AI SERVICE] Received response from Groq API in ${elapsedTime}ms`);
    console.log(`[AI SERVICE] Token usage - Prompt: ${data.usage?.prompt_tokens}, Completion: ${data.usage?.completion_tokens}`);

    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new ApiError(502, 'AI service returned an empty response');
    }

    // Add assistant message
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({
      success: true,
      chatId: chat._id,
      response: aiResponse,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('AI Chat error:', error);
    throw new ApiError(502, 'Failed to get AI response. Please try again.');
  }
});

/**
 * @desc    Get all chats for user (sidebar list)
 * @route   GET /api/ai/chats
 * @access  Private
 */
export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.user._id })
    .select('title updatedAt messages')
    .sort('-updatedAt')
    .lean();

  // Return only title, id, updatedAt, and message count
  const chatList = chats.map((c) => ({
    _id: c._id,
    title: c.title,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
  }));

  res.json({ success: true, chats: chatList });
});

/**
 * @desc    Get a single chat with full messages
 * @route   GET /api/ai/chats/:id
 * @access  Private
 */
export const getChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  res.json({ success: true, chat });
});

/**
 * @desc    Delete a chat
 * @route   DELETE /api/ai/chats/:id
 * @access  Private
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  res.json({ success: true, message: 'Chat deleted' });
});

/**
 * @desc    Generate grocery list from meals using AI
 * @route   POST /api/ai/generate-grocery
 * @access  Private
 */
export const generateGroceryList = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    throw new ApiError(400, 'Start date and end date are required');
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const meals = await Meal.find({
    user: req.user._id,
    mealDate: { $gte: start, $lte: end },
  });

  if (meals.length === 0) {
    return res.json({ success: true, groceryList: [] });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'AI service is not configured');
  }

  const mealDescriptions = meals.map(
    (m) => `- ${m.mealName} (Calories: ${m.calories}, Protein: ${m.protein}g, Carbs: ${m.carbs}g, Fat: ${m.fat}g)`
  ).join('\n');

  const prompt = `You are a helpful nutrition and meal-planning assistant. 
The user has logged the following meals during their selected time period:
${mealDescriptions}

Based on these meals, please generate a practical, combined weekly grocery list. 
Infer the likely raw ingredients required to prepare these meals. 
Auto-combine duplicate ingredients (e.g., if chicken is in two meals, combine the amounts).
Include realistic quantities (e.g., '2 kg', '18 eggs', '500 g').

Return **ONLY** a valid JSON array of objects with the keys 'item' and 'quantity'. Do not include markdown formatting or any other text.
Example format:
[
  { "item": "Chicken Breast", "quantity": "2 kg" },
  { "item": "Eggs", "quantity": "18" }
]
`;

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
        temperature: 0.1, // low temp for JSON consistency
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new ApiError(502, 'AI service returned an error.');
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '[]';
    
    // Attempt to strip out any markdown code blocks just in case
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let groceryList;
    try {
      groceryList = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI grocery response:', aiResponse);
      groceryList = [];
    }

    res.json({
      success: true,
      groceryList,
    });
  } catch (error) {
    console.error('Grocery Generation Error:', error);
    throw new ApiError(502, 'Failed to generate grocery list. Please try again.');
  }
});
