import { useState, useEffect } from 'react';
import { analyticsService } from '../../services';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Calendar, Flame, Beef, Wheat, Droplets, UtensilsCrossed, TrendingUp, TrendingDown, Award, Coffee, AlertTriangle, Lightbulb, FileText, Printer, ChevronRight, Loader2, X, Sparkles } from 'lucide-react';
import SkeletonCard from '../../components/ui/SkeletonCard';
import StatCard from '../../components/ui/StatCard';
import { mealTypeColors } from '../../utils/helpers';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AnalyticsPage = () => {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('Weekly');
  const [selectedReport, setSelectedReport] = useState(null);

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

  useEffect(() => {
    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const { data } = await api.get('/reports');
        setReports(data.reports || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const { data } = await api.post('/reports/generate', { type: reportType });
      setReports(prev => [data.report, ...prev]);
      setSelectedReport(data.report);
      toast.success('Report generated successfully!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMarkdown = (text) => {
    if(!text) return '';
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Replace headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="font-bold mb-2 mt-4">$1</h3>')
               .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mb-2 mt-5">$1</h2>')
               .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-2">$1</h1>');
    // Replace lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    return html;
  };

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

      {/* Nutrition Reports Section */}
      <div className="mt-12 pt-8 border-t border-dark-border print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue-500/10 rounded-xl">
               <FileText className="w-6 h-6 text-brand-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Nutrition Reports</h2>
              <p className="text-gray-400 text-sm">Generate comprehensive nutrition reports</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-blue-500 transition-colors text-sm"
            >
              <option value="Weekly">Weekly Report</option>
              <option value="Monthly">Monthly Report</option>
            </select>
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="btn-primary flex items-center gap-2 py-2.5"
            >
              {generatingReport ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadingReports ? (
             <div className="col-span-full flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-blue-500 animate-spin" /></div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <div 
                key={report._id} 
                onClick={() => setSelectedReport(report)}
                className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 hover:border-brand-blue-500/50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-white font-bold mb-1">{report.type} Report</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center group-hover:bg-brand-blue-500/10 group-hover:text-brand-blue-400">
                   <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-dark-surface/30 rounded-2xl border border-dark-border border-dashed">
              <p className="text-gray-500 mb-2 font-medium">No reports generated yet</p>
              <p className="text-gray-600 text-sm">Create your first insight report above</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Report Modal or View */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-center 
                        sm:items-center items-end bg-black/80 backdrop-blur-sm p-0 sm:p-4 print:bg-white print:p-0 print:absolute overflow-y-auto">
          <div className="bg-dark-card w-full max-w-4xl max-h-[90vh] sm:rounded-2xl flex flex-col border border-dark-border shadow-[0_0_50px_rgba(0,0,0,0.7)] print:border-none print:shadow-none print:text-black print:h-fit animate-fade-in relative mt-[10vh] sm:mt-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0 print:hidden sticky top-0 bg-dark-card z-10">
               <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">{selectedReport.type} Report</h3>
                  <p className="text-xs text-gray-400">{new Date(selectedReport.createdAt).toLocaleString()}</p>
               </div>
               <div className="flex gap-2">
                 <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-dark-border rounded-xl text-gray-300 hover:text-white hover:bg-dark-surface transition-colors text-sm font-medium break-keep whitespace-nowrap">
                    <Printer className="w-4 h-4" /> Download PDF
                 </button>
                 <button onClick={() => setSelectedReport(null)} className="p-2 bg-dark-surface text-gray-400 hover:text-white rounded-xl">
                    <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto p-6 lg:p-8 flex-1 print:p-0 print:overflow-visible">
               {/* Print Only Header */}
               <div className="hidden print:block mb-8 text-center pb-6 border-b border-gray-300">
                  <h1 className="text-3xl font-black text-black">NutriTrack Analytics</h1>
                  <p className="text-lg text-gray-600 font-medium">{selectedReport.type} Nutrition Report</p>
                  <p className="text-sm text-gray-500">{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                 {[
                   { label: 'Avg Calories', val: selectedReport.metrics.avgCalories + ' kcal' },
                   { label: 'Avg Protein', val: selectedReport.metrics.avgProtein + 'g' },
                   { label: 'Avg Carbs', val: selectedReport.metrics.avgCarbs + 'g' },
                   { label: 'Avg Fat', val: selectedReport.metrics.avgFat + 'g' },
                   { label: 'Consistency', val: selectedReport.metrics.consistency + '%' },
                   { label: 'Goal Adherence', val: selectedReport.metrics.goalAdherence + '%' },
                   { label: 'Top Meal', val: selectedReport.metrics.mostConsumedType },
                   { label: 'Skipped', val: selectedReport.metrics.mostSkippedType },
                 ].map(m => (
                   <div key={m.label} className="bg-dark-bg border border-dark-border p-4 rounded-xl print:bg-white print:border-gray-200">
                      <p className="text-xs text-gray-500 font-medium print:text-gray-600">{m.label}</p>
                      <p className="text-lg font-bold text-white print:text-black">{m.val}</p>
                   </div>
                 ))}
               </div>

               <div className="bg-dark-surface/30 p-6 rounded-xl border border-dark-border/50 print:bg-transparent print:border-none print:p-0">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 print:text-black print:mb-2">
                    <Sparkles className="w-5 h-5 text-brand-orange-500 print:text-black" /> 
                    Coach Analysis
                 </h3>
                 <div 
                    className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap print:text-black report-markdown"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(selectedReport.aiInsights) }}
                 />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles Overrides */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed.inset-0.z-50, .fixed.inset-0.z-50 * { visibility: visible; }
          .fixed.inset-0.z-50 {
             position: absolute !important;
             left: 0 !important;
             top: 0 !important;
             width: 100% !important;
             height: auto !important;
             background: white !important;
             color: black !important;
             display: block !important; /* Fixes Chrome flexbox print hang */
             overflow: visible !important;
          }
          .fixed.inset-0.z-50 > div {
             max-height: none !important;
             height: auto !important;
             overflow: visible !important;
             display: block !important;
             box-shadow: none !important;
          }
          .report-markdown strong { color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
