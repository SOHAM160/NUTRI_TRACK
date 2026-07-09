import { useState, useEffect } from 'react';
import { analyticsService } from '../../services';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Flame, Beef, Wheat, Droplets, UtensilsCrossed, TrendingUp, TrendingDown, Award, Coffee, AlertTriangle, Lightbulb } from 'lucide-react';
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

  const { daily = [], mealTypeDistribution = [], weeklySummary = {}, insights = [] } = analyticsData || {};
  const averages = weeklySummary.averages || {};

  // Custom tooltips — dark themed
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-surface p-3.5 rounded-xl shadow-lg border border-dark-border text-xs">
          <p className="font-bold text-white mb-2">{label}</p>
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

  // Map icon names from backend strings to Lucide components
  const iconMap = {
    Beef,
    Flame,
    Award,
    Coffee,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' };
      case 'warning':
        return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
      case 'danger':
        return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
      case 'info':
      default:
        return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Health Insights</h1>
          <p className="text-gray-400 mt-2">Track your progress and nutrient intake trends</p>
        </div>
        
        {/* Time range selector */}
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input-field w-full sm:w-44 bg-dark-bg border-dark-card"
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
          color="orange"
        />
        <StatCard
          icon={Beef}
          label="Avg Protein"
          value={averages.protein || 0}
          unit="g/d"
          color="red"
        />
        <StatCard
          icon={Wheat}
          label="Avg Carbs"
          value={averages.carbs || 0}
          unit="g/d"
          color="green"
        />
        <StatCard
          icon={Droplets}
          label="Avg Fat"
          value={averages.fat || 0}
          unit="g/d"
          color="blue"
        />
      </div>

      {/* Daily Calories trend / Area Chart */}
      <div className="card p-6 lg:p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-white tracking-tight">Daily Calories Trend</h2>
          <div className="w-9 h-9 rounded-xl bg-brand-orange-500/10 flex items-center justify-center">
             <TrendingUp className="w-[18px] h-[18px] text-brand-orange-500" />
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
                tick={{ fill: '#888' }}
              />
              <YAxis
                stroke="#666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={50}
                tick={{ fill: '#888' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="calories"
                name="Calories"
                stroke="#EA580C"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCalories)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#EA580C' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Macros breakdown and Meal Type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Macros Breakdown Bar Chart */}
        <div className="card p-6 lg:p-7">
          <h2 className="text-base font-semibold text-white tracking-tight mb-6">Daily Macronutrients (g)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={{ fill: '#888' }}
                />
                <YAxis
                  stroke="#666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={{ fill: '#888' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20, color: '#aaa' }} />
                <Bar dataKey="protein" name="Protein" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="carbs" name="Carbs" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="fat" name="Fat" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meal Type Distribution Pie Chart */}
        <div className="card p-6 lg:p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white tracking-tight">Meal Distribution</h2>
            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Based on entries</span>
          </div>
          <div className="h-80 flex items-center justify-center w-full">
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
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #2A2A2A',
                      background: '#161616',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#e5e5e5',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13, fontWeight: '500', color: '#aaa' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 text-dark-border mx-auto mb-4" />
                <p className="text-sm text-gray-500 font-medium">No meal distribution data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intelligent Insights Section */}
      {insights && insights.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-6 h-6 text-brand-orange-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">Intelligent Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {insights.map((insight, idx) => {
              const styles = getTypeStyles(insight.type);
              const InsightIcon = iconMap[insight.icon] || Lightbulb;
              
              return (
                <div 
                  key={idx} 
                  className={`card p-5 border flex items-start gap-4 transition-transform hover:-translate-y-1 ${styles.border}`}
                >
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${styles.bg}`}>
                    <InsightIcon className={`w-6 h-6 ${styles.text}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold capitalize mb-1 ${styles.text}`}>
                      {insight.type === 'danger' ? 'Action Required' : insight.type}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
