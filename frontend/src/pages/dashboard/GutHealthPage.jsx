import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gutHealthService } from '../../services';
import { 
  Activity, Wind, ArrowRight, Loader2, BookOpen, AlertCircle, Sparkles, Sprout
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatDateForInput, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SYMPTOMS_LIST = [
  { value: 'none', label: 'None (Feeling Great!)' },
  { value: 'bloating', label: 'Bloating' },
  { value: 'constipation', label: 'Constipation' },
  { value: 'acidity', label: 'Acid Reflux / Acidity' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'stomach_pain', label: 'Stomach Pain' },
  { value: 'gas', label: 'Excessive Gas' },
  { value: 'nausea', label: 'Nausea' }
];

const GutHealthPage = () => {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [selectedSymptom, setSelectedSymptom] = useState('none');
  const [severity, setSeverity] = useState(1);
  const [notes, setNotes] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await gutHealthService.getHistory();
      setLogs(res.data.logs.reverse()); // chronological for chart
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch gut health history');
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await gutHealthService.getInsights();
      setInsights(res.data.insights);
    } catch (error) {
      console.error(error);
      setInsights('Not enough data to analyze yet. Please ensure you have logged meals and symptoms over the past few days.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const initData = async () => {
    setLoading(true);
    await fetchLogs();
    await fetchInsights();
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        logDate: date,
        symptoms: [{ type: selectedSymptom, severity: selectedSymptom === 'none' ? 1 : Number(severity) }],
        notes
      };
      
      await gutHealthService.logSymptoms(payload);
      toast.success('Gut health logged successfully!');
      
      // Refresh Data
      await initData();
      
      // Reset Form
      setSelectedSymptom('none');
      setSeverity(1);
      setNotes('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recharts Chart Data (Latest 7 days)
  const chartData = logs.slice(-7).map(item => ({
    date: new Date(item.logDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.gutScore,
    fiber: item.metrics?.fiberCons || 0
  }));

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const currentScore = latestLog?.gutScore || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange-500/20 to-orange-600/10 border border-brand-orange-500/30 flex items-center justify-center">
          <Activity className="w-6 h-6 text-brand-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gut Health</h1>
          <p className="text-gray-400 mt-1">Track digestion, analyze symptoms, and improve your microbiome</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Logging Form & Mini Stats */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Latest Score Card */}
          <div className="card p-7 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sprout className="w-32 h-32" />
            </div>
            
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Current Gut Score</h2>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className={`text-6xl font-extrabold ${currentScore >= 80 ? 'text-green-500' : currentScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {currentScore}
              </span>
              <span className="text-xl text-gray-500">/100</span>
            </div>
            <p className="text-sm text-gray-400">
              {currentScore >= 80 ? 'Excellent! Your gut is thriving.' : currentScore >= 50 ? 'Moderate. Room for improvement.' : 'Needs attention. Check your fiber intake.'}
            </p>
            
            {latestLog && (
              <div className="mt-6 pt-6 border-t border-dark-border grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Today's Fiber</p>
                  <p className="font-semibold text-white">{latestLog.metrics?.fiberCons || 0}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Probiotics</p>
                  <p className="font-semibold text-white">{latestLog.metrics?.probioticCons || 0} sources</p>
                </div>
              </div>
            )}
          </div>

          {/* Logging Form */}
          <div className="card p-7">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-400" />
              Log Symptoms
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Date</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>

              <div>
                <label className="label">Primary Symptom</label>
                <select 
                  value={selectedSymptom}
                  onChange={(e) => setSelectedSymptom(e.target.value)}
                  className="input-field"
                >
                  {SYMPTOMS_LIST.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {selectedSymptom !== 'none' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="label !mb-0">Severity</label>
                    <span className="text-xs font-bold text-brand-orange-500">{severity}/10</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full accent-brand-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Notes / Triggers</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field resize-none"
                  rows="2"
                  placeholder="E.g., Felt bloated right after lunch..."
                />
              </div>
              
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Log Symptoms'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right Col: Charts & Insights */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart */}
          <div className="card p-7">
            <h2 className="text-lg font-bold text-white mb-6">Gut Score Trend</h2>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#333', borderRadius: '12px' }}
                      itemStyle={{ color: '#ea580c' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Activity className="w-8 h-8 mb-2 opacity-20" />
                  <p>Log symptoms to see your trend</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Insights Card */}
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-orange-500/10 to-brand-blue-500/10 border-b border-dark-border p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-brand-orange-500" />
                <h2 className="text-lg font-bold text-white">Microbiome Analysis</h2>
              </div>
              <button onClick={fetchInsights} disabled={insightsLoading} className="text-xs font-semibold text-brand-orange-500 max-w-max hover:bg-brand-orange-500/10 px-3 py-1.5 rounded-lg transition-colors">
                {insightsLoading ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="p-7">
              {insightsLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-brand-orange-500 animate-spin mb-4" />
                  <p className="text-gray-400">Analyzing your recent meals and symptoms...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ 
                    __html: insights
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-bold">$1</span>')
                      .replace(/\*(.*?)\*/g, '<span class="text-gray-200 italic">$1</span>')
                      .replace(/- (.*?)(<br\/>|$)/g, '<li class="ml-4 list-disc">$1</li>') 
                  }} />
                </div>
              )}
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default GutHealthPage;
