import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { mealService } from '../../services';
import { formatDateForInput } from '../../utils/helpers';

const mealSchema = z.object({
  mealName: z.string().min(1, 'Meal name is required').max(100),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack'], { required_error: 'Select a meal type' }),
  calories: z.coerce.number().min(1, 'Calories must be positive'),
  protein: z.coerce.number().min(0).optional().default(0),
  carbs: z.coerce.number().min(0).optional().default(0),
  fat: z.coerce.number().min(0).optional().default(0),
  fiber: z.coerce.number().min(0).optional().default(0),
  sugar: z.coerce.number().min(0).optional().default(0),
  sodium: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional().default(''),
  mealDate: z.string().min(1, 'Date is required'),
});

const MealFormModal = ({ isOpen, onClose, meal, onSuccess }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditing = !!meal;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      mealName: '',
      mealType: 'Breakfast',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      notes: '',
      mealDate: formatDateForInput(new Date()),
    },
  });

  useEffect(() => {
    if (meal) {
      reset({
        mealName: meal.mealName,
        mealType: meal.mealType,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        sugar: meal.sugar,
        sodium: meal.sodium,
        notes: meal.notes || '',
        mealDate: formatDateForInput(meal.mealDate),
      });
      setImagePreview(meal.image || '');
    } else {
      reset({
        mealName: '',
        mealType: 'Breakfast',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        notes: '',
        mealDate: formatDateForInput(new Date()),
      });
      setImagePreview('');
    }
    setImageFile(null);
  }, [meal, reset, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditing) {
        await mealService.updateMeal(meal._id, formData);
        toast.success('Meal updated successfully');
      } else {
        await mealService.createMeal(formData);
        toast.success('Meal logged successfully');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative card max-w-2xl w-full max-h-[90vh] flex flex-col border-[#333] animate-fade-in shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between px-8 py-5 border-b border-dark-border shrink-0">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEditing ? 'Edit Meal Log' : 'Log New Meal'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-surface transition-colors text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 flex-1">
          <form id="meal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-dark-surface/50 p-6 rounded-2xl border border-dark-border border-dashed flex flex-col sm:flex-row items-center gap-6">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-dark-border" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
              )}
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-300 font-medium mb-1">Visual Log (Optional)</p>
                <p className="text-xs text-gray-500 mb-3">Snap a picture of your dish for better tracking</p>
                <label className="btn-secondary !px-4 !py-2 !text-xs cursor-pointer inline-flex">
                  <Upload className="w-3.5 h-3.5" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">Meal Name *</label>
                <input {...register('mealName')} className={`input-field ${errors.mealName ? 'input-error' : ''}`} placeholder="e.g. Scrambled Eggs" />
                {errors.mealName && <p className="text-xs text-red-500 mt-1.5">{errors.mealName.message}</p>}
              </div>
              <div>
                <label className="label">Category *</label>
                <select {...register('mealType')} className={`input-field ${errors.mealType ? 'input-error' : ''}`}>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label">Date *</label>
                <input type="date" {...register('mealDate')} className={`input-field ${errors.mealDate ? 'input-error' : ''}`} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="label text-brand-orange-500">Total Calories (kcal) *</label>
                <input type="number" {...register('calories')} className={`input-field border-brand-orange-500/30 focus:border-brand-orange-500 ${errors.calories ? 'input-error' : ''}`} placeholder="0" />
                {errors.calories && <p className="text-xs text-red-500 mt-1.5">{errors.calories.message}</p>}
              </div>
            </div>

            <div>
              <label className="label mb-3 text-gray-300">Macronutrients <span className="text-gray-500">(grams)</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { name: 'protein', label: 'Protein' },
                  { name: 'carbs', label: 'Carbs' },
                  { name: 'fat', label: 'Fat' },
                  { name: 'fiber', label: 'Fiber' },
                  { name: 'sugar', label: 'Sugar' },
                  { name: 'sodium', label: 'Sodium (mg)' },
                ].map(({ name, label }) => (
                  <div key={name} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 uppercase">{label.split(' ')[0]}</span>
                    <input type="number" step="any" {...register(name)} className="input-field !pl-16 !pr-3 !py-2.5 !text-sm text-right" placeholder="0" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Additional Notes</label>
              <textarea {...register('notes')} className="input-field resize-none" rows="3" placeholder="Recipe tweaks, feelings, etc..." />
            </div>
          </form>
        </div>

        <div className="flex gap-4 justify-end px-8 py-5 border-t border-dark-border bg-dark-bg/50 shrink-0">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors" disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="meal-form" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditing ? 'Save Changes' : 'Log Meal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealFormModal;
