import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { User, Lock, Upload, Loader2, Heart } from 'lucide-react';
import { activityLevelLabels, goalLabels, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';
import MultiSelect from '../../components/ui/MultiSelect';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  age: z.coerce.number().min(1).max(120).optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional().default(''),
  height: z.coerce.number().min(0).optional().or(z.literal('')),
  weight: z.coerce.number().min(0).optional().or(z.literal('')),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', '']).optional().default(''),
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'improve_health', '']).optional().default(''),
  nutritionGoals: z.object({
    calories: z.coerce.number().min(0).optional(),
    protein: z.coerce.number().min(0).optional(),
    carbs: z.coerce.number().min(0).optional(),
    fat: z.coerce.number().min(0).optional(),
  }).optional(),
  healthPreferences: z.object({
    medicalConditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
  }).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors }, setValue: setProfileValue, watch: watchProfile } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { 
      name: '', age: '', gender: '', height: '', weight: '', activityLevel: '', goal: '',
      nutritionGoals: { calories: 2000, protein: 150, carbs: 250, fat: 70 },
      healthPreferences: { medicalConditions: [], allergies: [], dietaryRestrictions: [] }
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '', age: user.age || '', gender: user.gender || '', height: user.height || '', weight: user.weight || '', activityLevel: user.activityLevel || '', goal: user.goal || '',
        nutritionGoals: {
          calories: user.nutritionGoals?.calories || 2000,
          protein: user.nutritionGoals?.protein || 150,
          carbs: user.nutritionGoals?.carbs || 250,
          fat: user.nutritionGoals?.fat || 70,
        },
        healthPreferences: {
          medicalConditions: user.healthPreferences?.medicalConditions || [],
          allergies: user.healthPreferences?.allergies || [],
          dietaryRestrictions: user.healthPreferences?.dietaryRestrictions || [],
        }
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const cleanedData = {
        ...data,
        age: data.age === '' ? undefined : Number(data.age),
        height: data.height === '' ? undefined : Number(data.height),
        weight: data.weight === '' ? undefined : Number(data.weight),
        nutritionGoals: data.nutritionGoals,
        healthPreferences: data.healthPreferences,
      };
      
      const { data: res } = await authService.updateProfile(cleanedData);
      updateUser(res.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

    const formData = new FormData();
    formData.append('profileImage', file);

    setImageUploading(true);
    try {
      const { data: res } = await authService.uploadProfileImage(formData);
      updateUser(res.user);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-gray-400 mt-2">Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="card p-8 flex flex-col items-center text-center">
          <div className="relative group">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-dark-surface" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-400">{getInitials(user?.name)}</span>
              </div>
            )}
            
            <label className="absolute bottom-1 right-1 p-3 bg-brand-orange-500 rounded-full text-white cursor-pointer hover:bg-brand-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.4)] transition-all">
              {imageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
            </label>
          </div>

          <h2 className="text-2xl font-bold text-white mt-6">{user?.name}</h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">{user?.email}</p>

          <span className="text-xs bg-dark-surface border border-dark-border text-gray-300 font-bold px-4 py-2 rounded-full uppercase tracking-widest">
            NutriCal Member
          </span>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="card p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-dark-border pb-4">
              <User className="w-5 h-5 text-gray-400" /> 
              Profile Details
            </h3>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div>
                <label className="label">Full Name</label>
                <input {...registerProfile('name')} className={`input-field ${profileErrors.name ? 'input-error' : ''}`} placeholder="Name" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="label">Age</label>
                  <input type="number" {...registerProfile('age')} className="input-field" placeholder="Yrs" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select {...registerProfile('gender')} className="input-field">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Height (cm)</label>
                  <input type="number" {...registerProfile('height')} className="input-field" placeholder="175" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="label">Weight (kg)</label>
                  <input type="number" {...registerProfile('weight')} className="input-field" placeholder="70" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Activity Level</label>
                  <select {...registerProfile('activityLevel')} className="input-field">
                    <option value="">Select Activity</option>
                    {Object.entries(activityLevelLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-brand-orange-500">Fitness Objective</label>
                <select {...registerProfile('goal')} className="input-field border-brand-orange-500/20">
                  <option value="">Select Goal</option>
                  {Object.entries(goalLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 mt-6 border-t border-dark-border">
                <h4 className="text-md font-bold text-white mb-4">Daily Nutrition Goals</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="label">Calories (kcal)</label>
                    <input type="number" {...registerProfile('nutritionGoals.calories')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Protein (g)</label>
                    <input type="number" {...registerProfile('nutritionGoals.protein')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Carbs (g)</label>
                    <input type="number" {...registerProfile('nutritionGoals.carbs')} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Fat (g)</label>
                    <input type="number" {...registerProfile('nutritionGoals.fat')} className="input-field" />
                  </div>
                </div>
              </div>

            <div className="flex justify-end pt-6 mt-4 border-t border-dark-border">
                <button type="submit" className="btn-primary px-8" disabled={profileLoading}>
                  {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Parameters'}
                </button>
              </div>
            </form>
          </div>

          <div className="card p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-dark-border pb-4">
              <Heart className="w-5 h-5 text-red-500" />
              Health Preferences
            </h3>

            <div className="space-y-6">
              <div>
                <label className="label">Medical Conditions</label>
                <div className="text-xs text-gray-500 mb-2">Select any existing medical conditions to receive personalized AI advice and warnings.</div>
                <MultiSelect
                  options={[
                    { value: 'Diabetes', label: 'Diabetes' },
                    { value: 'Hypertension', label: 'Hypertension' },
                    { value: 'High Cholesterol', label: 'High Cholesterol' },
                    { value: 'PCOS', label: 'PCOS' },
                    { value: 'Kidney Disease', label: 'Kidney Disease' }
                  ]}
                  value={watchProfile('healthPreferences.medicalConditions') || []}
                  onChange={(val) => setProfileValue('healthPreferences.medicalConditions', val, { shouldDirty: true })}
                  placeholder="Select conditions"
                />
              </div>

              <div>
                <label className="label">Dietary Restrictions</label>
                <div className="text-xs text-gray-500 mb-2">Select your dietary type to tailor meal plans.</div>
                <MultiSelect
                  options={[
                    { value: 'Vegan', label: 'Vegan' },
                    { value: 'Vegetarian', label: 'Vegetarian' },
                    { value: 'Gluten-Free', label: 'Gluten-Free' },
                    { value: 'Dairy-Free', label: 'Dairy-Free' },
                    { value: 'Keto', label: 'Keto' },
                    { value: 'Paleo', label: 'Paleo' }
                  ]}
                  value={watchProfile('healthPreferences.dietaryRestrictions') || []}
                  onChange={(val) => setProfileValue('healthPreferences.dietaryRestrictions', val, { shouldDirty: true })}
                  placeholder="Select diets"
                />
              </div>
              
              <div>
                <label className="label">Allergies</label>
                <div className="text-xs text-gray-500 mb-2">Select common allergens to avoid them in AI recommendations.</div>
                <MultiSelect
                  options={[
                    { value: 'Peanuts', label: 'Peanuts' },
                    { value: 'Tree Nuts', label: 'Tree Nuts' },
                    { value: 'Shellfish', label: 'Shellfish' },
                    { value: 'Soy', label: 'Soy' },
                    { value: 'Eggs', label: 'Eggs' },
                    { value: 'Fish', label: 'Fish' }
                  ]}
                  value={watchProfile('healthPreferences.allergies') || []}
                  onChange={(val) => setProfileValue('healthPreferences.allergies', val, { shouldDirty: true })}
                  placeholder="Select allergies"
                />
              </div>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-dark-border pb-4">
              <Lock className="w-5 h-5 text-gray-400" />
              Security
            </h3>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <div>
                <label className="label">Current Password</label>
                <input type="password" {...registerPassword('currentPassword')} className={`input-field ${passwordErrors.currentPassword ? 'input-error' : ''}`} placeholder="••••••" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" {...registerPassword('newPassword')} className={`input-field ${passwordErrors.newPassword ? 'input-error' : ''}`} placeholder="••••••" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" {...registerPassword('confirmPassword')} className={`input-field ${passwordErrors.confirmPassword ? 'input-error' : ''}`} placeholder="••••••" />
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-4 border-t border-dark-border">
                <button type="submit" className="btn-secondary text-brand-orange-500 border-brand-orange-500/50 hover:bg-brand-orange-500/10 px-8" disabled={passwordLoading}>
                  {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
