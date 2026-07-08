import { useState, useEffect } from 'react';
import { analyticsService } from '../../services';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Flame, Beef, Wheat, Droplets, UtensilsCrossed, TrendingUp } from 'lucide-react';
import SkeletonCard from '../../components/ui/SkeletonCard';
import StatCard from '../../components/ui/StatCard';
import { mealTypeColors } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data } = await analyticsService.getAnalytics({ days });
        setAnalyticsData(data);
      } catch (err) {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="h-8 skeleton w-48" />
          <div className="h-10 skeleton w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <SkeletonCard count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const { daily = [], mealTypeDistribution = [], weeklySummary = {} } = analyticsData || {};
  const averages = weeklySummary.averages || {};

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3.5 rounded-xl shadow-lg border border-dark-200 text-xs">
          <p className="font-bold text-dark-900 mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="font-medium flex items-center justify-between gap-4 mt-1" style={{ color: item.color }}>
              <span>{item.name}:</span>
              <span>{item.value} {item.name === 'Calories' ? 'kcal' : 'g'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Convert distribution data for Pie Chart
  const pieData = mealTypeDistribution.map((item) => ({
    name: item._id,
    value: item.count,
    calories: item.totalCalories,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 tracking-tight">Analytics</h1>
          <p className="text-dark-500 text-sm mt-1.5">Track your progress and nutrient intake trends</p>
        </div>
        
        {/* Time range selector */}
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input-field w-full sm:w-44 bg-white"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* Averages Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Flame}
          label="Avg Calories"
          value={averages.calories || 0}
          unit="kcal/d"
          color="amber"
        />
        <StatCard
          icon={Beef}
          label="Avg Protein"
          value={averages.protein || 0}
          unit="g/d"
          color="rose"
        />
        <StatCard
          icon={Wheat}
          label="Avg Carbs"
          value={averages.carbs || 0}
          unit="g/d"
          color="emerald"
        />
        <StatCard
          icon={Droplets}
          label="Avg Fat"
          value={averages.fat || 0}
          unit="g/d"
          color="primary"
        />
      </div>

      {/* Daily Calories trend / Area Chart */}
      <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-sm border border-dark-100/60">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-dark-900 tracking-tight">Daily Calories Trend</h2>
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
             <TrendingUp className="w-[18px] h-[18px] text-amber-500" />
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="calories"
                name="Calories"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCalories)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Macros breakdown and Meal Type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Macros Breakdown Bar Chart */}
        <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-sm border border-dark-100/60">
          <h2 className="text-base font-semibold text-dark-900 tracking-tight mb-6">Daily Macronutrients (g)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                <Bar dataKey="protein" name="Protein" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="carbs" name="Carbs" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="fat" name="Fat" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meal Type Distribution Pie Chart */}
        <div className="bg-white p-6 lg:p-7 rounded-2xl shadow-sm border border-dark-100/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-dark-900 tracking-tight">Meal Distribution</h2>
            <span className="text-[11px] text-dark-400 font-medium uppercase tracking-wider">Based on entries</span>
          </div>
          <div className="h-80 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={mealTypeColors[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} meals (${props.payload.calories} kcal)`,
                      name,
                    ]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: '500' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: '500' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 text-dark-300 mx-auto mb-4" />
                <p className="text-sm text-dark-500 font-medium">No meal distribution data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
