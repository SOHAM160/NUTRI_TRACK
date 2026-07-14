import { useState, useEffect, useCallback } from 'react';
import { mealService } from '../../services';
import MealFormModal from '../../components/meals/MealFormModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { Plus, Search, UtensilsCrossed, Pencil, Trash2, Eye, Calendar, Flame, Beef, Wheat, Droplets, X, SlidersHorizontal, BookmarkPlus, FolderHeart } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import AddToCollectionModal from '../../components/meals/AddToCollectionModal';
import FavoritesCollectionModal from '../../components/meals/FavoritesCollectionModal';

const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [mealType, setMealType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minCalories, setMinCalories] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const [minProtein, setMinProtein] = useState('');
  const [maxProtein, setMaxProtein] = useState('');
  const [sort, setSort] = useState('-mealDate');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editMeal, setEditMeal] = useState(null);
  const [viewMeal, setViewMeal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [addFavoriteModalOpen, setAddFavoriteModalOpen] = useState(false);
  const [favoriteItemData, setFavoriteItemData] = useState(null);
  const [prefillMealData, setPrefillMealData] = useState(null);

  const fetchMeals = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (notes) params.notes = notes;
      if (mealType) params.mealType = mealType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minCalories) params.minCalories = minCalories;
      if (maxCalories) params.maxCalories = maxCalories;
      if (minProtein) params.minProtein = minProtein;
      if (maxProtein) params.maxProtein = maxProtein;
      if (sort) params.sort = sort;

      const { data } = await mealService.getMeals(params);
      setMeals(data.meals);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  }, [search, notes, mealType, startDate, endDate, minCalories, maxCalories, minProtein, maxProtein, sort]);

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
    setNotes('');
    setMealType('');
    setStartDate('');
    setEndDate('');
    setMinCalories('');
    setMaxCalories('');
    setMinProtein('');
    setMaxProtein('');
    setSort('-mealDate');
  };

  const hasFilters = search || notes || mealType || startDate || endDate || minCalories || maxCalories || minProtein || maxProtein || sort !== '-mealDate';

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
        <div className="flex items-center gap-3">
          <button onClick={() => setCollectionModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-surface border border-dark-border text-gray-300 hover:text-brand-orange-500 hover:border-brand-orange-500/50 transition-all font-medium text-sm">
            <FolderHeart className="w-5 h-5" /> Favorites & Collections
          </button>
          <button onClick={() => { setEditMeal(null); setPrefillMealData(null); setFormOpen(true); }} className="btn-primary">
            <Plus className="w-5 h-5" /> Add Meal
          </button>
        </div>
      </div>

      <div className="card p-5 sm:p-6 space-y-4 relative z-10">
        {/* Main Row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by food name..."
              className="input-field pl-12 bg-dark-bg border-dark-card focus:border-brand-orange-500"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field w-full sm:w-48 bg-dark-bg border-dark-card"
            >
              <option value="-mealDate">Latest First</option>
              <option value="mealDate">Oldest First</option>
              <option value="-calories">Highest Calories</option>
              <option value="calories">Lowest Calories</option>
            </select>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                showAdvanced || hasFilters
                  ? 'border-brand-orange-500/30 bg-brand-orange-500/10 text-brand-orange-400'
                  : 'border-dark-border bg-dark-surface hover:bg-dark-border text-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
              <span>Filters</span>
              {hasFilters && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-brand-orange-500 text-white rounded-full">
                  Active
                </span>
              )}
            </button>

            {/* Clear Button */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 text-sm font-medium transition-all duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced && (
          <div className="pt-4 border-t border-dark-border/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* Meal Type Select */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="input-field bg-dark-bg border-dark-card text-sm"
              >
                <option value="">All Types</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            {/* Search by Notes */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Search Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Search notes..."
                className="input-field bg-dark-bg border-dark-card text-sm"
              />
            </div>

            {/* Date Range Start */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field bg-dark-bg border-dark-card text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field bg-dark-bg border-dark-card text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Minimum Calories */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Min Calories (kcal)</label>
              <input
                type="number"
                min="0"
                value={minCalories}
                onChange={(e) => setMinCalories(e.target.value)}
                placeholder="0"
                className="input-field bg-dark-bg border-dark-card text-sm"
              />
            </div>

            {/* Maximum Calories */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Max Calories (kcal)</label>
              <input
                type="number"
                min="0"
                value={maxCalories}
                onChange={(e) => setMaxCalories(e.target.value)}
                placeholder="2000"
                className="input-field bg-dark-bg border-dark-card text-sm"
              />
            </div>

            {/* Minimum Protein */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Min Protein (g)</label>
              <input
                type="number"
                min="0"
                value={minProtein}
                onChange={(e) => setMinProtein(e.target.value)}
                placeholder="0"
                className="input-field bg-dark-bg border-dark-card text-sm"
              />
            </div>

            {/* Maximum Protein */}
            <div>
              <label className="label text-xs uppercase tracking-wider text-gray-500">Max Protein (g)</label>
              <input
                type="number"
                min="0"
                value={maxProtein}
                onChange={(e) => setMaxProtein(e.target.value)}
                placeholder="100"
                className="input-field bg-dark-bg border-dark-card text-sm"
              />
            </div>
          </div>
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
                    <button onClick={() => { setFavoriteItemData(meal); setAddFavoriteModalOpen(true); }} className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-gray-400 hover:text-brand-orange-500 hover:border-brand-orange-500/50 transition-all" title="Add to Favorites">
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(meal)} className="p-2.5 rounded-xl bg-dark-surface border border-dark-border text-gray-400 hover:text-white transition-colors" title="Edit">
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

      <MealFormModal 
        isOpen={formOpen} 
        onClose={() => { setFormOpen(false); setEditMeal(null); setPrefillMealData(null); }} 
        meal={editMeal} 
        prefillData={prefillMealData}
        onSuccess={() => fetchMeals(pagination.page)} 
      />
      
      <AddToCollectionModal
        isOpen={addFavoriteModalOpen}
        onClose={() => { setAddFavoriteModalOpen(false); setFavoriteItemData(null); }}
        itemData={favoriteItemData}
        itemType="Meal"
      />

      <FavoritesCollectionModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        onLogMeal={(data) => {
          setPrefillMealData(data);
          setEditMeal(null);
          setFormOpen(true);
        }}
      />
      
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
