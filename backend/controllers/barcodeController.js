import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

// ─── FatSecret OAuth 2.0 Token Cache ────────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Get a valid FatSecret OAuth 2.0 access token (cached until expiry).
 */
const getFatSecretToken = async () => {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(500, 'FatSecret API credentials are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FATSECRET] Token error:', response.status, errorText);
    throw new ApiError(502, 'Failed to authenticate with FatSecret API');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 86400) * 1000;

  // console.log('[FATSECRET] Access token obtained successfully');
  return cachedToken;
};

/**
 * Call a FatSecret API method using the method-based endpoint
 */
const callFatSecretAPI = async (method, params = {}) => {
  const token = await getFatSecretToken();

  const body = new URLSearchParams({
    method,
    format: 'json',
    ...params,
  });

  const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[FATSECRET] API error for ${method}:`, response.status, errorText);
    return null;
  }

  return response.json();
};

/**
 * Extract nutrition values from FatSecret's serving data.
 * FatSecret returns servings as either an object or array.
 */
const extractNutrition = (servings) => {
  if (!servings || !servings.serving) return null;

  // FatSecret can return a single serving object or an array
  const servingList = Array.isArray(servings.serving) ? servings.serving : [servings.serving];

  // Prefer "Per 100g" serving, fallback to first serving
  let serving = servingList.find(
    (s) => s.serving_description?.toLowerCase().includes('100g') ||
           s.serving_description?.toLowerCase().includes('100 g') ||
           s.metric_serving_amount === '100.000'
  ) || servingList[0];

  return {
    calories: Math.round(Number(serving.calories || 0)),
    protein: Math.round(Number(serving.protein || 0) * 10) / 10,
    carbs: Math.round(Number(serving.carbohydrate || 0) * 10) / 10,
    fat: Math.round(Number(serving.fat || 0) * 10) / 10,
    sugar: Math.round(Number(serving.sugar || 0) * 10) / 10,
    fiber: Math.round(Number(serving.fiber || 0) * 10) / 10,
    sodium: Math.round(Number(serving.sodium || 0)),
    servingDescription: serving.serving_description || '',
    metricAmount: serving.metric_serving_amount || '',
    metricUnit: serving.metric_serving_unit || '',
  };
};

/**
 * Use AI (Groq) to estimate nutrition when FatSecret has no data.
 */
const estimateNutritionWithAI = async (productName) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a nutrition database. Given a food product name, return realistic per-serving nutrition values.

Product: "${productName}"

Return ONLY a valid JSON object with these numeric keys (no markdown, no explanation):
{
  "calories": <number in kcal>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "sugar": <number in grams>,
  "fiber": <number in grams>,
  "sodium": <number in mg>
}`;

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
        temperature: 0.1,
        max_tokens: 256,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '';
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(aiResponse);
  } catch (err) {
    console.error('[BARCODE] AI estimation failed:', err.message);
    return null;
  }
};

/**
 * @desc    Search for a product by barcode using FatSecret API
 * @route   POST /api/barcode/search
 * @access  Private
 */
export const searchBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.body;

  if (!barcode || !barcode.trim()) {
    throw new ApiError(400, 'Barcode is required');
  }

  const cleanBarcode = barcode.trim();

  try {
    // ─── Step 1: Find food_id by barcode in FatSecret ───
    // console.log(`[BARCODE] Looking up barcode: ${cleanBarcode} in FatSecret`);

    let foodId = null;
    let productName = '';
    let imageUrl = '';
    let brand = '';

    const barcodeResult = await callFatSecretAPI('food.find_id_for_barcode', {
      barcode: cleanBarcode,
    });

    if (barcodeResult?.food_id) {
      foodId = barcodeResult.food_id.value || barcodeResult.food_id;
      // console.log(`[BARCODE] Found food_id: ${foodId} in FatSecret`);
    }

    // ─── Step 1.5: If FatSecret doesn't have the barcode, ask Open Food Facts for the name and image ───
    if (!foodId) {
      // console.log(`[BARCODE] Not found in FatSecret. Asking Open Food Facts for the product name...`);
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`);
        if (offRes.ok) {
          const offData = await offRes.json();
          if (offData.status === 1 && offData.product) {
            productName = offData.product.product_name || offData.product.product_name_en || '';
            imageUrl = offData.product.image_front_url || offData.product.image_url || '';
            // console.log(`[BARCODE] Open Food Facts resolved name: "${productName}"`);
          }
        }
      } catch (e) {
        console.error('[BARCODE] OFF lookup failed');
      }
    }

    // ─── Step 2: Get full food details from FatSecret ───
    let nutrition = null;
    let servingSize = '';
    let source = 'fatsecret';

    if (foodId) {
      const foodResult = await callFatSecretAPI('food.get.v4', {
        food_id: String(foodId),
      });

      if (foodResult?.food) {
        const food = foodResult.food;
        productName = food.food_name || productName || 'Unknown Product';
        brand = food.brand_name || '';
        imageUrl = food.food_images?.food_image?.[0]?.image_url || imageUrl || '';

        nutrition = extractNutrition(food.servings);
        if (nutrition) {
          servingSize = nutrition.servingDescription || 
                       `${nutrition.metricAmount} ${nutrition.metricUnit}`.trim() || 
                       '1 serving';
        }

        // console.log(`[BARCODE] FatSecret food: ${productName} (${brand})`);
      }
    }

    // ─── Step 3: If no foodId, but we got the name from OFF, search FatSecret by name ───
    if (!foodId && productName) {
      // console.log(`[BARCODE] Searching FatSecret for product name: "${productName}"`);

      // take only the first 2-3 words for better search hits
      const searchQuery = productName.split(' ').slice(0, 3).join(' ');

      const searchResult = await callFatSecretAPI('foods.search', {
        search_expression: searchQuery,
      });

      if (searchResult?.foods?.food) {
        const foods = Array.isArray(searchResult.foods.food) 
          ? searchResult.foods.food 
          : [searchResult.foods.food];
        
        const firstFood = foods[0];
        foodId = firstFood.food_id;
        
        // Keep the OFF name as it might be more specific, but get brand from FatSecret
        brand = firstFood.brand_name || '';

        // console.log(`[BARCODE] Found FatSecret match: ${firstFood.food_name}`);

        const foodResult = await callFatSecretAPI('food.get.v4', {
          food_id: String(foodId),
        });

        if (foodResult?.food) {
          nutrition = extractNutrition(foodResult.food.servings);
          imageUrl = foodResult.food.food_images?.food_image?.[0]?.image_url || '';
          if (nutrition) {
            servingSize = nutrition.servingDescription || '1 serving';
          }
        }
      }
    }

    // ─── Step 4: If still no data, fall back to AI estimation using the name from OFF ───
    if (!nutrition || (nutrition.calories === 0 && nutrition.protein === 0)) {
      if (!productName) productName = `Product (barcode: ${cleanBarcode})`;

      // console.log(`[BARCODE] No FatSecret data. Falling back to AI for "${productName}"`);

      const aiEstimate = await estimateNutritionWithAI(productName);
      if (aiEstimate) {
        nutrition = {
          calories: aiEstimate.calories || 0,
          protein: aiEstimate.protein || 0,
          carbs: aiEstimate.carbs || 0,
          fat: aiEstimate.fat || 0,
          sugar: aiEstimate.sugar || 0,
          fiber: aiEstimate.fiber || 0,
          sodium: aiEstimate.sodium || 0,
        };
        source = 'ai-estimated';
        servingSize = '1 serving (estimated)';
      }
    }

    // ─── Step 5: If absolutely nothing found ───
    if (!productName || productName.includes('barcode:')) {
      if (!nutrition || source === 'ai-estimated') {
        return res.json({
          success: false,
          message: 'Product not found in any database. Please enter details manually.',
        });
      }
    }

    const result = {
      productName: productName || 'Unknown Product',
      brand,
      imageUrl,
      servingSize: servingSize || '1 serving',
      calories: nutrition?.calories || 0,
      protein: nutrition?.protein || 0,
      carbs: nutrition?.carbs || 0,
      fat: nutrition?.fat || 0,
      sugar: nutrition?.sugar || 0,
      fiber: nutrition?.fiber || 0,
      sodium: nutrition?.sodium || 0,
      barcode: cleanBarcode,
      source,
    };

    // console.log(`[BARCODE] Final result (source: ${source}):`, result);

    res.json({
      success: true,
      product: result,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('Barcode lookup error:', error);
    throw new ApiError(502, 'Failed to look up barcode. Please try again.');
  }
});
