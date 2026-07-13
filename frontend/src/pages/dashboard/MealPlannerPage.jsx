import { useState, useEffect } from 'react';
import { Calendar, Loader2, Sparkles, Plus, RefreshCw, Save, CheckCircle2, ChevronDown, ListChecks } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDateForInput } from '../../utils/helpers';

const MealPlannerPage = () => {
  const [activeTab, setActiveTab] = useState('generator'); // generator, saved
  
  // Generator State
  const [dietPreference, setDietPreference] = useState('Standard');
  const [mealsToGenerate, setMealsToGenerate] = useState(['Breakfast', 'Lunch', 'Dinner', 'Snack']);
  const [generatedMeals, setGeneratedMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [regeneratingMap, setRegeneratingMap] = useState({});
  const [savingLoading, setSavingLoading] = useState(false);
  const [loggedMealsTracker, setLoggedMealsTracker] = useState({});
  
  // Saved Plans State
  const [savedPlans, setSavedPlans] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  
  const dietOptions = [
    'Standard', 'Vegetarian', 'Vegan', 'Keto', 'High-Protein', 'Indian Diet', 'Paleo', 'Mediterranean'
  ];
  
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  const toggleMealToGenerate = (mealType) => {
    setMealsToGenerate(prev => 
      prev.includes(mealType)
        ? prev.filter(m => m !== mealType)
        : [...prev, mealType]
    );
  };

  const handleGenerate = async () => {
    if (mealsToGenerate.length === 0) {
      toast.error('Please select at least one meal to generate');
      return;
    }
    
    setLoading(true);
    setGeneratedMeals([]);
    setLoggedMealsTracker({});
    
    try {
      const response = await api.post('/meal-plans/generate', {
        dietPreference,
        mealsToGenerate
      });
      setGeneratedMeals(response.data.meals || []);
      toast.success('Meal plan generated!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateMeal = async (index, meal) => {
    setRegeneratingMap(prev => ({ ...prev, [index]: true }));
    try {
      const response = await api.post('/meal-plans/regenerate-single', {
        dietPreference,
        mealType: meal.mealType,
        targetCalories: meal.calories,
        targetProtein: meal.protein,
        targetCarbs: meal.carbs,
        targetFat: meal.fat
      });
      
      const newMeal = response.data.meal;
      setGeneratedMeals(prev => {
        const copy = [...prev];
        copy[index] = newMeal;
        return copy;
      });
      
      // Reset logged tracker for this specific regenerated meal
      setLoggedMealsTracker(prev => {
        const copy = { ...prev };
        delete copy[`${newMeal.mealType}-${index}`];
        return copy;
      });
      
      toast.success(`${meal.mealType} regenerated!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to regenerate meal');
    } finally {
      setRegeneratingMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleLogMeal = async (meal, index) => {
    const key = `${meal.mealType}-${index}`;
    if(loggedMealsTracker[key]) return; // already logged
    
    const loadingToast = toast.loading(`Logging ${meal.mealName}...`);
    try {
      const formData = new FormData();
      formData.append('mealName', meal.mealName);
      formData.append('mealType', meal.mealType);
      formData.append('calories', meal.calories);
      formData.append('protein', meal.protein);
      formData.append('carbs', meal.carbs);
      formData.append('fat', meal.fat);
      formData.append('notes', 'Logged via AI Meal Planner');
      formData.append('mealDate', formatDateForInput(new Date()));
      
      await api.post('/meals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(`${meal.mealType} logged successfully!`, { id: loadingToast });
      setLoggedMealsTracker(prev => ({ ...prev, [key]: true }));
    } catch (error) {
      toast.error('Failed to log meal', { id: loadingToast });
    }
  };

  const handleSavePlan = async () => {
    if (generatedMeals.length === 0) return;
    
    setSavingLoading(true);
    try {
      await api.post('/meal-plans', {
        dietPreference,
        meals: generatedMeals
      });
      toast.success('Meal plan saved successfully!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setSavingLoading(false);
    }
  };

  const fetchSavedPlans = async () => {
    setSavedLoading(true);
    try {
      const res = await api.get('/meal-plans');
      setSavedPlans(res.data.plans || []);
    } catch(err) {
      toast.error('Failed to load saved plans');
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedPlans();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 bg-brand-orange-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-brand-orange-500" />
            </span>
            AI Meal Planner
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-2xl">
            Automatically generate a structured meal plan powered by AI, tailored exactly to your active remaining macros.
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-dark-surface/50 border border-dark-border rounded-xl backdrop-blur-sm w-max">
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'generator' ? 'bg-dark-border text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-border/50'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'saved' ? 'bg-dark-border text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-border/50'
          }`}
        >
          Saved Plans
        </button>
      </div>

      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-brand-blue-500" />
              Configure Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Diet Preference</label>
                <div className="relative">
                  <select 
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-brand-orange-500 transition-colors"
                  >
                    {dietOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Meals to generate</label>
                <div className="flex flex-wrap gap-3">
                  {mealTypes.map(meal => (
                    <button
                      key={meal}
                      onClick={() => toggleMealToGenerate(meal)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 ${
                        mealsToGenerate.includes(meal)
                          ? 'bg-brand-blue-500/10 border-brand-blue-500/30 text-brand-blue-400'
                          : 'bg-dark-bg border-dark-border text-gray-400 hover:bg-dark-border'
                      }`}
                    >
                      {mealsToGenerate.includes(meal) && <CheckCircle2 className="w-4 h-4" />}
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'Generating...' : 'Generate Meal Plan'}
              </button>
            </div>
          </div>

          {generatedMeals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Your AI Generated Plan</h3>
                <button 
                  onClick={handleSavePlan}
                  disabled={savingLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white hover:bg-dark-border transition-colors text-sm font-medium"
                >
                  {savingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedMeals.map((meal, idx) => (
                  <div key={idx} className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 hover:border-brand-orange-500/30 transition-colors animate-fade-in relative overflow-hidden group flex flex-col">
                    {/* Regenerating Overlay */}
                    {regeneratingMap[idx] && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                         <Loader2 className="w-8 h-8 text-brand-orange-500 animate-spin" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue-500 mb-1 block">
                          {meal.mealType}
                        </span>
                        <h4 className="text-lg font-bold text-white pr-4">{meal.mealName}</h4>
                      </div>
                      <div className="bg-brand-orange-500/10 text-brand-orange-500 px-3 py-1 rounded-lg font-bold">
                        {meal.calories} kcal
                      </div>
                    </div>

                    <div className="flex gap-4 p-3 bg-dark-bg/50 rounded-xl mb-4 border border-dark-border/50">
                      <div className="flex-1 flex flex-col items-center">
                         <span className="text-xs text-gray-500 font-medium">Protein</span>
                         <span className="text-gray-200 font-bold">{meal.protein}g</span>
                      </div>
                      <div className="w-px bg-dark-border/50"></div>
                      <div className="flex-1 flex flex-col items-center">
                         <span className="text-xs text-gray-500 font-medium">Carbs</span>
                         <span className="text-gray-200 font-bold">{meal.carbs}g</span>
                      </div>
                      <div className="w-px bg-dark-border/50"></div>
                      <div className="flex-1 flex flex-col items-center">
                         <span className="text-xs text-gray-500 font-medium">Fat</span>
                         <span className="text-gray-200 font-bold">{meal.fat}g</span>
                      </div>
                    </div>
                    
                    <div className="mb-6 flex-1">
                      <p className="text-sm font-medium text-gray-400 mb-2">Ingredients:</p>
                      <ul className="grid grid-cols-1 gap-1">
                        {meal.ingredients?.map((ing, i) => (
                           <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-500/50 mt-1.5 shrink-0" />
                             {ing}
                           </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                       <button
                         onClick={() => handleLogMeal(meal, idx)}
                         disabled={loggedMealsTracker[`${meal.mealType}-${idx}`]}
                         className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                           loggedMealsTracker[`${meal.mealType}-${idx}`]
                             ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                             : 'bg-brand-orange-500 text-white hover:bg-brand-orange-600'
                         }`}
                       >
                         {loggedMealsTracker[`${meal.mealType}-${idx}`] ? (
                           <><CheckCircle2 className="w-4 h-4" /> Logged</>
                         ) : (
                           <><Plus className="w-4 h-4" /> Log Meal</>
                         )}
                       </button>
                       <button
                         onClick={() => handleRegenerateMeal(idx, meal)}
                         className="flex-1 py-2.5 rounded-xl border border-dark-border bg-dark-bg text-gray-300 hover:text-white hover:border-brand-blue-500/50 hover:bg-brand-blue-500/10 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                       >
                         <RefreshCw className="w-4 h-4" /> Regenerate
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-6">
          {savedLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-orange-500 animate-spin" />
            </div>
          ) : savedPlans.length === 0 ? (
            <div className="text-center py-20 px-4 bg-dark-surface/50 border border-dark-border rounded-2xl backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-surface mb-4 border border-dark-border">
                <Save className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Saved Plans</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Generate a meal plan and save it to view it here later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlans.map(plan => (
                <div key={plan._id} className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 hover:border-brand-blue-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {new Date(plan.createdAt).toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })}
                      </h4>
                      <span className="text-xs bg-dark-bg border border-dark-border px-2 py-1 rounded text-gray-400">
                        {plan.dietPreference}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-brand-blue-500 bg-brand-blue-500/10 px-2 py-1 rounded-lg">
                      {plan.meals?.length} Meals
                    </span>
                  </div>

                  <div className="space-y-3">
                    {plan.meals?.map((m, i) => (
                      <div key={i} className="flex justify-between items-center bg-dark-bg p-3 rounded-xl border border-dark-border text-sm">
                        <div>
                           <p className="text-gray-300 font-medium leading-tight mb-0.5">{m.mealName}</p>
                           <p className="text-gray-500 text-xs">{m.mealType}</p>
                        </div>
                        <span className="text-brand-orange-500 font-semibold">{m.calories}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealPlannerPage;
