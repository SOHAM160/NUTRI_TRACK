import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services';
import StatCard from '../../components/ui/StatCard';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { Flame, Beef, Wheat, Droplets, UtensilsCrossed, TrendingUp, Calendar, Trophy, Zap, Target, HeartPulse, CheckCircle2, XCircle } from 'lucide-react';
import { getGreeting, formatDate } from '../../utils/helpers';

const getRecommendations = (conditions) => {
  if (!conditions || conditions.length === 0) return null;
  const prefer = new Set();
  const avoid = new Set();
  
  if (conditions.includes('Diabetes')) {
    prefer.add('Oats & Quinoa'); prefer.add('Leafy Greens'); prefer.add('Lean Proteins');
    avoid.add('Sugary Drinks'); avoid.add('Refined Carbs'); avoid.add('Sweets');
  }
  if (conditions.includes('Hypertension')) {
    prefer.add('Potassium-rich fruits'); prefer.add('Whole Grains');
    avoid.add('High Sodium Foods'); avoid.add('Canned Soups'); avoid.add('Processed Snacks');
  }
  if (conditions.includes('High Cholesterol')) {
    prefer.add('Nuts & Seeds'); prefer.add('Fatty Fish'); prefer.add('Avocados');
    avoid.add('Trans Fats'); avoid.add('Processed Meats'); avoid.add('Full-fat Dairy');
  }
  if (conditions.includes('PCOS')) {
    prefer.add('High-fiber Veggies'); prefer.add('Berries');
    avoid.add('Refined Sugars'); avoid.add('White Bread/Pasta');
  }
  if (conditions.includes('Kidney Disease')) {
    prefer.add('Apples & Berries'); prefer.add('Cabbage & Cauliflower');
    avoid.add('High-potassium Foods'); avoid.add('Processed Meats');
  }

  return { prefer: Array.from(prefer).slice(0, 4), avoid: Array.from(avoid).slice(0, 4) };
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, streakRes] = await Promise.all([
          analyticsService.getDashboardSummary(),
          analyticsService.getStreakData(),
        ]);
        setData(dashRes.data);
        setStreakData(streakRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="h-8 bg-dark-card rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard count={4} />
        </div>
      </div>
    );
  }

  const currentStreak = streakData?.streak?.current || 0;
  const longestStreak = streakData?.streak?.longest || 0;
  const todayOnTrack = streakData?.todayOnTrack || false;
  
  const recommendations = getRecommendations(user?.healthPreferences?.medicalConditions);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, <span className="text-brand-orange-500">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 mt-2">Here's your nutrition overview for today</p>
        </div>
        <Link to="/dashboard/meals" className="btn-primary">
           Log a Meal
        </Link>
      </div>

      {/* Today's Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <StatCard icon={Flame} label="Calories Today" value={data?.today?.calories || 0} unit="kcal" color="orange" />
        <StatCard icon={Beef} label="Protein" value={data?.today?.protein || 0} unit="g" color="red" />
        <StatCard icon={Wheat} label="Carbs" value={data?.today?.carbs || 0} unit="g" color="green" />
        <StatCard icon={Droplets} label="Fat" value={data?.today?.fat || 0} unit="g" color="blue" />
        <div className="hidden xl:block">
           <StatCard icon={UtensilsCrossed} label="Meals Logged" value={data?.today?.mealCount || 0} color="purple" />
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Streak Card */}
        <div className="card p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange-500/20 to-orange-600/10 border border-brand-orange-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-white">Goal Streak</h2>
            </div>

            <div className="flex items-center justify-center mb-8 mt-4">
              <div className="relative">
                {/* Streak ring */}
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${
                  currentStreak > 0 ? 'border-brand-orange-500 shadow-[0_0_25px_rgba(234,88,12,0.3)]' : 'border-dark-border'
                }`}>
                  <div className="text-center">
                    <span className={`text-4xl font-extrabold ${currentStreak > 0 ? 'text-brand-orange-500' : 'text-gray-500'}`}>
                      {currentStreak}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {currentStreak === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                </div>
                {/* Flame icon for active streaks */}
                {currentStreak > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-orange-500 flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-sm">🔥</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> Current Streak
              </span>
              <span className="text-white font-bold">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Longest Streak
              </span>
              <span className="text-white font-bold">{longestStreak} {longestStreak === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-dark-surface border border-dark-border">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Target className="w-4 h-4" /> Today's Status
              </span>
              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                todayOnTrack
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {todayOnTrack ? '✓ On Track' : '○ In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Goals Progress */}
        <div className="card p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center">
              <Flame className="w-5 h-5 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-white">Daily Goals Progress</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Calories', current: data?.today?.calories || 0, target: user?.nutritionGoals?.calories || 2000, unit: 'kcal', color: 'bg-brand-orange-500' },
              { label: 'Protein', current: data?.today?.protein || 0, target: user?.nutritionGoals?.protein || 150, unit: 'g', color: 'bg-red-500' },
              { label: 'Carbs', current: data?.today?.carbs || 0, target: user?.nutritionGoals?.carbs || 250, unit: 'g', color: 'bg-green-500' },
              { label: 'Fat', current: data?.today?.fat || 0, target: user?.nutritionGoals?.fat || 70, unit: 'g', color: 'bg-blue-500' },
            ].map(({ label, current, target, unit, color }) => {
              const percentage = Math.min(Math.round((current / (target || 1)) * 100), 100);
              return (
                <div key={label}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="text-gray-300 font-medium">{label}</span>
                    <span className="text-gray-400">
                      {current} / {target} <span className="text-xs">{unit}</span> ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-dark-card rounded-full overflow-hidden border border-dark-border/50">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Weekly Summary */}
        <div className="card p-7 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-white">Weekly Summary</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Total Calories', value: `${(data?.weekly?.calories || 0).toLocaleString()} kcal` },
              { label: 'Avg. Daily Calories', value: `${(data?.weekly?.avgCalories || 0).toLocaleString()} kcal` },
              { label: 'Total Protein', value: `${data?.weekly?.protein || 0}g` },
              { label: 'Total Carbs', value: `${data?.weekly?.carbs || 0}g` },
              { label: 'Total Fat', value: `${data?.weekly?.fat || 0}g` },
              { label: 'Meals Logged', value: data?.weekly?.mealCount || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-dark-border/50 last:border-0">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className="text-gray-200 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Meals */}
        <div className="card p-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Recent Meals</h2>
            <Link to="/dashboard/meals" className="text-sm font-semibold text-brand-orange-500 hover:text-brand-orange-600 transition-colors">
              View All
            </Link>
          </div>

          {data?.recentMeals?.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {data.recentMeals.slice(0, 4).map((meal) => (
                <div key={meal._id} className="p-4 rounded-xl bg-dark-surface border border-dark-border flex items-center gap-4 hover:border-[#333] transition-colors">
                  {meal.image ? (
                    <img src={meal.image} alt={meal.mealName} className="w-14 h-14 rounded-xl object-cover ring-1 ring-dark-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-dark-card flex items-center justify-center flex-shrink-0 border border-dark-border">
                      <UtensilsCrossed className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{meal.mealName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-dark-card text-gray-400 px-2.5 py-1 rounded-md border border-dark-border">
                        {meal.mealType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-orange-500">{meal.calories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-dark-surface border border-dark-border flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No meals logged recently</p>
            </div>
          )}
        </div>
        
        {/* Health Recommendations */}
        {recommendations && (
          <div className="card p-7 flex flex-col justify-between lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-dark-surface border border-dark-border flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Dietary Recommendations</h2>
                <p className="text-sm text-gray-500">Based on your medical conditions</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4" /> Foods to Prefer
                </h3>
                <ul className="space-y-3">
                  {recommendations.prefer.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <XCircle className="w-4 h-4" /> Foods to Avoid
                </h3>
                <ul className="space-y-3">
                  {recommendations.avoid.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
