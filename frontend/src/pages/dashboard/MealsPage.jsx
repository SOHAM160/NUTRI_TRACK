import { useState, useEffect, useCallback } from 'react';
import { mealService } from '../../services';
import MealFormModal from '../../components/meals/MealFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { Plus, Search, UtensilsCrossed, Pencil, Trash2, Eye, Calendar, Flame, Beef, Wheat, Droplets, X } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [viewMeal, setViewMeal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeals = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (mealType) params.mealType = mealType;
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }
      const { data } = await mealService.getMeals(params);
      setMeals(data.meals);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  }, [search, mealType, dateFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchMeals(), 300);
    return () => clearTimeout(debounce);
  }, [fetchMeals]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mealService.deleteMeal(deleteId);
      toast.success('Meal deleted');
      setDeleteId(null);
      fetchMeals(pagination.page);
    } catch (err) {
      toast.error('Failed to delete meal');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (meal) => {
    setEditMeal(meal);
    setFormOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setMealType('');
    setDateFilter('');
  };

  const hasFilters = search || mealType || dateFilter;

  // Dark theme distinct colors mapping for labels
  const getLabelColors = (type) => {
    switch (type) {
      case 'Breakfast': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Lunch': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Dinner': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Snack': return 'bg-brand-orange-500/10 text-brand-orange-400 border-brand-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Meal Logging</h1>
          <p className="text-gray-400 mt-2">{pagination.total} meals in your history</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus className="w-5 h-5" /> Add Meal
        </button>
      </div>

      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row gap-4 relative z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meals..."
            className="input-field pl-12 bg-dark-bg border-dark-card focus:border-brand-orange-500"
          />
        </div>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="input-field w-full sm:w-48 bg-dark-bg border-dark-card"
        >
          <option value="">All Types</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-field w-full sm:w-48 bg-dark-bg border-dark-card"
          style={{ colorScheme: 'dark' }}
        />
        {hasFilters && (
          <button onClick={clearFilters} className="btn-secondary whitespace-nowrap">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={6} />
        </div>
      ) : meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={hasFilters ? 'No meals found' : 'No meals yet'}
          description={hasFilters ? 'Try adjusting your search criteria' : 'Start logging your meals to build your history'}
          action={!hasFilters && (
            <button onClick={() => setFormOpen(true)} className="btn-primary mt-4">
               Add First Meal
            </button>
          )}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <div key={meal._id} className="card overflow-hidden group hover:border-[#333] transition-all relative flex flex-col">
                {/* Header Image Area */}
                <div className="h-48 w-full bg-dark-surface relative overflow-hidden shrink-0">
                  {meal.image ? (
                    <img src={meal.image} alt={meal.mealName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-12 h-12 text-dark-border" />
                    </div>
                  )}
                  {/* Gentle gradient overlay to anchor the floating date */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card to-transparent opacity-80" />
                  
                  {/* Floating Date */}
                  <div className="absolute bottom-3 left-4 z-10 flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(meal.mealDate)}
                  </div>
                </div>

                <div className="p-6 relative z-10 w-full flex-grow flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white truncate">{meal.mealName}</h3>
                    <div className="mt-2.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getLabelColors(meal.mealType)}`}>
                        {meal.mealType}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-6">
                    <div className="bg-dark-surface rounded-xl p-2 text-center border border-dark-border">
                      <Flame className="w-4 h-4 mx-auto mb-1 text-brand-orange-500" />
                      <p className="text-sm font-bold text-gray-200">{meal.calories}</p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-2 text-center border border-dark-border">
                      <Beef className="w-4 h-4 mx-auto mb-1 text-red-400" />
                      <p className="text-sm font-bold text-gray-200">{meal.protein}</p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-2 text-center border border-dark-border">
                      <Wheat className="w-4 h-4 mx-auto mb-1 text-green-400" />
                      <p className="text-sm font-bold text-gray-200">{meal.carbs}</p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-2 text-center border border-dark-border">
                      <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                      <p className="text-sm font-bold text-gray-200">{meal.fat}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <button onClick={() => setViewMeal(meal)} className="flex-1 btn-secondary !py-2.5 !text-sm">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button onClick={() => handleEdit(meal)} className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-gray-400 hover:text-white transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(meal._id)} className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-gray-400 hover:text-red-500 hover:border-red-500/50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchMeals} />
        </>
      )}

      {/* View Meal Overlay */}
      {viewMeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewMeal(null)} />
          <div className="relative card max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in border-[#333] flex flex-col p-0">
            
            {/* Header Image Area */}
            <div className="relative h-64 bg-dark-surface w-full shrink-0">
              {viewMeal.image ? (
                <img src={viewMeal.image} className="w-full h-full object-cover opacity-90" alt="Meal" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed className="w-16 h-16 text-dark-border" />
                </div>
              )}
              {/* Smooth gradient fade into the solid background */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-black/40" />

              <button onClick={() => setViewMeal(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md transition-colors border border-white/10 z-20 shadow-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-8 pt-6 relative z-10 bg-dark-card w-full flex-grow">
              <h2 className="text-2xl font-bold text-white mb-2">{viewMeal.mealName}</h2>
              <div className="flex items-center gap-3">
                 <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getLabelColors(viewMeal.mealType)}`}>
                   {viewMeal.mealType}
                 </span>
                 <span className="text-sm text-gray-400 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(viewMeal.mealDate)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { label: 'Calories', value: `${viewMeal.calories} kcal`, color: 'text-brand-orange-500' },
                  { label: 'Protein', value: `${viewMeal.protein}g`, color: 'text-gray-200' },
                  { label: 'Carbs', value: `${viewMeal.carbs}g`, color: 'text-gray-200' },
                  { label: 'Fat', value: `${viewMeal.fat}g`, color: 'text-gray-200' },
                  { label: 'Fiber', value: `${viewMeal.fiber}g`, color: 'text-gray-400' },
                  { label: 'Sugar', value: `${viewMeal.sugar}g`, color: 'text-gray-400' },
                  { label: 'Sodium', value: `${viewMeal.sodium}mg`, color: 'text-gray-400' },
                ].map((item, i) => (
                  <div key={i} className="bg-dark-surface p-4 rounded-xl border border-dark-border flex flex-col items-center justify-center text-center">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {viewMeal.notes && (
                <div className="mt-6 bg-dark-surface p-5 rounded-xl border border-dark-border">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">Notes</p>
                  <p className="text-gray-300 text-sm">{viewMeal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MealFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditMeal(null); }} meal={editMeal} onSuccess={() => fetchMeals(pagination.page)} />
      
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Meal"
        message="Are you sure you want to permanently delete this meal log?"
        loading={deleting}
      />
    </div>
  );
};

export default MealsPage;
