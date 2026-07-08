import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Activity, Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-bg text-gray-300 font-sans animate-fade-in">
      <div className="hidden lg:block w-1/2 bg-black border-r border-dark-border relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&q=80")' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-transparent to-dark-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-bg" />
        
        <div className="absolute bottom-20 left-20 right-20 text-white z-10">
           <h2 className="text-4xl font-bold mb-4">Start Your Journey.</h2>
           <p className="text-gray-300 text-lg">Join NutriCal Track today and take control of your diet and wellness.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-brand-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[420px] relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-9 h-9 rounded-full bg-brand-orange-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">NutriCal</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-gray-400 mb-8">It's free to get started.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input {...register('name')} type="text" placeholder="John Doe" className={`input-field pl-12 ${errors.name ? 'input-error' : ''}`} />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-2">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input {...register('email')} type="email" placeholder="you@email.com" className={`input-field pl-12 ${errors.email ? 'input-error' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-2">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" className={`input-field pl-12 pr-12 ${errors.password ? 'input-error' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-2">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} placeholder="Verify password" className={`input-field pl-12 ${errors.confirmPassword ? 'input-error' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-2">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base !mt-10">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-8 flex items-center justify-center gap-2">
            Already a member?
            <Link to="/login" className="text-brand-orange-500 font-semibold hover:text-brand-orange-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
