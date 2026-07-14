import { useState, useEffect } from 'react';
import { X, Search, FolderHeart, Tag, UtensilsCrossed, Trash2, CalendarHeart } from 'lucide-react';
import { favoriteService } from '../../services';
import toast from 'react-hot-toast';

const FavoritesCollectionModal = ({ isOpen, onClose, onLogMeal }) => {
  const [favorites, setFavorites] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = activeFolderState('All');
  const [search, setSearch] = useState('');
  
  // Custom wrapper to init multiple states
  function activeFolderState(initial) {
    return useState(initial);
  }

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, activeFolder, search]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const [favRes, folderRes] = await Promise.all([
        favoriteService.getFavorites({ 
          folder: activeFolder === 'All' ? '' : activeFolder,
          search
        }),
        favoriteService.getFolders()
      ]);
      setFavorites(favRes.data.favorites);
      setFolders(['All', ...folderRes.data.folders]);
    } catch (err) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await favoriteService.deleteFavorite(id);
      toast.success('Removed from collections');
      fetchFavorites();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative card w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in z-10 border-[#333] p-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-card">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderHeart className="w-6 h-6 text-brand-orange-500" />
              My Collections
            </h2>
            <p className="text-sm text-gray-400 mt-1">Organize and access your favorite meals and plans.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-surface rounded-full text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Sidebar - Folders */}
          <div className="w-full md:w-64 bg-dark-surface/50 border-r border-dark-border p-4 flex flex-col overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="input-field pl-9 bg-dark-card border-dark-border text-sm"
                />
              </div>
            </div>
            
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3 px-2">Folders</h3>
            <div className="space-y-1">
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFolder(f)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFolder === f 
                      ? 'bg-brand-orange-500/10 text-brand-orange-500 border border-brand-orange-500/20' 
                      : 'text-gray-400 hover:bg-dark-card hover:text-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Main List */}
          <div className="flex-1 p-6 overflow-y-auto bg-dark-card">
            {loading ? (
              <div className="text-center text-gray-500 py-10 animate-pulse">Loading favorites...</div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center justify-center">
                <FolderHeart className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-gray-300">Nothing found</h3>
                <p className="text-gray-500 text-sm mt-2">No saved items in this collection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.map(fav => (
                  <div key={fav._id} className="bg-dark-surface border border-dark-border rounded-xl p-4 hover:border-brand-orange-500/50 transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         {fav.type === 'Meal' ? <UtensilsCrossed className="w-4 h-4 text-brand-orange-400"/> : <CalendarHeart className="w-4 h-4 text-purple-400"/>}
                         <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-dark-card text-gray-300 border border-dark-border">{fav.type}</span>
                       </div>
                       <button onClick={(e) => handleDelete(fav._id, e)} className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    
                    <h4 className="text-lg font-bold text-white mt-1 mb-1">{fav.name}</h4>
                    <p className="text-xs text-gray-400 mb-4 flex-1">
                      {fav.type === 'Meal' && fav.data?.calories ? `${fav.data.calories} kcal • ${fav.data.protein}g protein` : ''}
                    </p>

                    {fav.tags && fav.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {fav.tags.map(t => (
                          <span key={t} className="text-[10px] flex items-center gap-1 font-medium bg-black/30 border border-dark-border text-gray-400 px-1.5 py-0.5 rounded-sm">
                            <Tag className="w-2.5 h-2.5" /> {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {fav.type === 'Meal' && (
                      <button 
                        onClick={() => {
                          onLogMeal(fav.data);
                          onClose();
                        }} 
                        className="w-full btn-secondary !py-2 !text-xs mt-auto hover:bg-brand-orange-500 hover:text-white hover:border-brand-orange-500"
                      >
                        Log this Meal
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesCollectionModal;
