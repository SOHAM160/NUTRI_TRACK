import { useState, useEffect } from 'react';
import { X, FolderPlus, Tag } from 'lucide-react';
import { favoriteService } from '../../services';
import toast from 'react-hot-toast';

const AddToCollectionModal = ({ isOpen, onClose, itemData, itemType }) => {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('Uncategorized');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingFolders, setExistingFolders] = useState(['Uncategorized']);
  const [isNewFolder, setIsNewFolder] = useState(false);

  useEffect(() => {
    if (isOpen && itemData) {
      if (itemType === 'Meal') setName(itemData.mealName || '');
      if (itemType === 'MealPlan') setName('My Custom Meal Plan');
      fetchFolders();
    }
  }, [isOpen, itemData, itemType]);

  const fetchFolders = async () => {
    try {
      const { data } = await favoriteService.getFolders();
      setExistingFolders(data.folders);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Name is required');

    setLoading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      await favoriteService.addFavorite({
        name,
        type: itemType,
        folder: folder.trim() || 'Uncategorized',
        tags: tagArray,
        data: itemData
      });
      toast.success('Added to collection!');
      onClose();
    } catch (err) {
      toast.error('Failed to add to collection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative card w-full max-w-md animate-fade-in z-10 border-[#333]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-brand-orange-500" />
            Save to Collection
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-surface rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field bg-dark-surface border-dark-border"
              placeholder="e.g. My Favorite Breakfast"
              required
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="label !mb-0">Folder</label>
              <button 
                type="button" 
                onClick={() => setIsNewFolder(!isNewFolder)}
                className="text-xs text-brand-orange-500 hover:text-brand-orange-400"
              >
                {isNewFolder ? 'Select Existing' : '+ New Folder'}
              </button>
            </div>
            
            {isNewFolder ? (
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="input-field bg-dark-surface border-dark-border"
                placeholder="New Folder Name"
              />
            ) : (
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="input-field bg-dark-surface border-dark-border"
              >
                {existingFolders.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field bg-dark-surface border-dark-border"
              placeholder="e.g. healthy, low-carb, post-workout"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
            <button type="button" onClick={onClose} className="btn-secondary !text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary !text-sm min-w-[100px]">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
