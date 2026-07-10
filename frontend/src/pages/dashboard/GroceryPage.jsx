import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Loader2, Printer, Check, ListChecks } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GroceryPage = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutritrack_grocery_list');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved grocery list');
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('nutritrack_grocery_list', JSON.stringify(items));
  }, [items]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/ai/generate-grocery', { startDate, endDate });
      
      const generatedList = response.data.groceryList || [];
      if (generatedList.length === 0) {
        toast.error('No meals found in this date range.');
      } else {
        // Initialize checked state to false
        const initialList = generatedList.map(item => ({ ...item, checked: false }));
        setItems(initialList);
        toast.success('Grocery list generated successfully!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to generate list');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  const printList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="p-2 bg-brand-orange-500/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-brand-orange-500" />
            </span>
            Grocery List Generator
          </h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base max-w-2xl">
            Automatically generate a shopping list based on the meals you've eaten or planned.
          </p>
        </div>
        
        {items.length > 0 && (
          <button
            onClick={printList}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border rounded-xl text-white hover:bg-dark-border transition-colors w-full sm:w-auto print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print List</span>
          </button>
        )}
      </div>

      {/* Date Controls - Hidden when printing */}
      <div className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 sm:p-6 backdrop-blur-sm print:hidden">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-blue-500" />
          Select Date Range
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-orange-500 transition-colors"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-orange-500 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto bg-brand-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-orange-600 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>Generate List</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grocery List Render */}
      {items.length > 0 ? (
        <div className="bg-dark-surface/50 border border-dark-border rounded-2xl p-5 sm:p-6 backdrop-blur-sm print:bg-white print:border-none print:text-black mt-6">
          <div className="flex items-center gap-2 mb-6 border-b border-dark-border pb-4 print:border-gray-300">
            <ListChecks className="w-6 h-6 text-brand-orange-500 print:text-black" />
            <h2 className="text-xl font-bold text-white print:text-black">Your Shopping List</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, index) => (
              <div 
                key={index}
                onClick={() => toggleItem(index)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none print:break-inside-avoid print:border-gray-200 print:p-2 ${
                  item.checked 
                    ? 'bg-dark-bg/50 border-dark-border/50 opacity-60' 
                    : 'bg-dark-bg border-dark-border hover:border-brand-orange-500/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.checked 
                    ? 'bg-brand-orange-500 border-brand-orange-500' 
                    : 'border-gray-500 print:border-gray-400'
                }`}>
                  {item.checked && <Check className="w-4 h-4 text-white" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-medium truncate print:text-black ${
                    item.checked ? 'text-gray-500 line-through' : 'text-gray-200'
                  }`}>
                    {item.item}
                  </p>
                </div>
                
                <div className={`text-sm font-medium whitespace-nowrap print:text-black ${
                  item.checked ? 'text-gray-600' : 'text-brand-blue-400'
                }`}>
                  {item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 px-4 pt-10 print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-dark-surface mb-4 border border-dark-border">
            <ShoppingCart className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No items yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Select a date range and click generate to build a smart grocery list based on your meals.
          </p>
        </div>
      )}

      {/* Print-only styling overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, aside, header {
            display: none !important;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          /* Override background utility */
          .bg-dark-bg { background-color: white !important; }
        }
      `}</style>
    </div>
  );
};

// Quick fix for missing SparklesIcon import
const SparklesIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

export default GroceryPage;
