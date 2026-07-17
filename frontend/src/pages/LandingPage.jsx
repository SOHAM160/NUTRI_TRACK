import { Link } from 'react-router-dom';
import { Activity, BarChart3, UtensilsCrossed, Shield, Zap, ArrowRight, Star, Heart, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/80 backdrop-blur-md border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
             <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-brand-orange-500 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </span>
                NutriCal <span className="text-brand-blue-500">Track</span>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">About us</a>
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary">
              Contact Us Now <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden flex flex-col justify-center items-center text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dark-border bg-dark-card/50 text-gray-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-brand-orange-500 animate-pulse" />
            Fitness & Wellness
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Smart <span className="text-brand-orange-500">Nutrition Tracker</span> <br/>
            with Seamless Logging
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Easily manage your daily macronutrients, visualize your progress, and stay focused on your health goals through a visually engaging interface.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
             <span className="px-4 py-2 rounded-full border border-dark-border bg-dark-surface/50 text-gray-400 text-sm">Smart Nutrition Tracking</span>
             <span className="px-4 py-2 rounded-full border border-dark-border bg-dark-surface/50 text-gray-400 text-sm">Meal Logging</span>
             <span className="px-4 py-2 rounded-full border border-dark-border bg-dark-surface/50 text-gray-400 text-sm">Personalized Diet Plans</span>
             <span className="px-4 py-2 rounded-full border border-dark-border bg-dark-surface/50 text-gray-400 text-sm">Food Photo Recognition</span>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link to="/register" className="btn-primary !px-8 !py-4 text-base shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                Start Tracking Free
             </Link>
             <Link to="/login" className="btn-secondary !px-8 !py-4 text-base">
                Go to Dashboard
             </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-dark-surface/30 border-y border-dark-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Technologies Leveraged</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Everything you need to monitor your nutrition and reach your ultimate fitness peak.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Meal Tracking', desc: 'Log meals with macronutrient breakdown.', icon: UtensilsCrossed },
              { title: 'Advanced Analytics', desc: 'Visualize data with interactive charts.', icon: BarChart3 },
              { title: 'Goal Setting', desc: 'Track progress towards personalized targets.', icon: Heart },
              { title: 'Secure Data', desc: 'Your health data is completely private.', icon: Shield },
              { title: 'Quick Logging', desc: 'Intuitive interface for speedy entry.', icon: Zap },
              { title: 'Visual Logs', desc: 'Attach photos for better accountability.', icon: CheckCircle2 },
            ].map((f, i) => (
              <div key={i} className="bg-dark-card border border-dark-border rounded-3xl p-8 hover:border-[#444] transition-colors">
                <div className="w-12 h-12 rounded-full bg-dark-surface border border-dark-border flex items-center justify-center mb-6">
                  <f.icon className="w-5 h-5 text-brand-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section matching screen 4 */}
      <section id="about" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-[#121212] rounded-3xl p-10 md:p-14 border border-[#222]">
               <h2 className="text-3xl font-bold text-brand-orange-500 mb-6">About us</h2>
               <p className="text-gray-300 leading-relaxed text-lg">
                 Nutrition tracking app that simplifies daily meal logging. It offers personalized goal setting, real-time nutritional analysis, and motivational insights through a visually engaging dashboard. Users can easily log meals with photo capture or manual entry, track macros, and review progress toward their health targets. With secure data management and tailored recommendations, NutriCal Track helps users make informed, healthier choices effortlessly every day.
               </p>
            </div>
            
            <div className="bg-[#121212] rounded-3xl p-10 flex flex-col justify-center gap-8 border border-[#222]">
               <div>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-1 h-6 rounded-full bg-brand-orange-500" />
                   <h3 className="font-semibold text-white">Client's Location</h3>
                 </div>
                 <p className="text-gray-400 text-sm ml-4">United States</p>
               </div>
               
               <div>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-1 h-6 rounded-full bg-brand-blue-500" />
                   <h3 className="font-semibold text-white">Development Time</h3>
                 </div>
                 <p className="text-gray-400 text-sm ml-4">06 Weeks</p>
               </div>

               <div>
                 <div className="flex items-center gap-3 mb-2">
                   <div className="w-1 h-6 rounded-full bg-brand-orange-500" />
                   <h3 className="font-semibold text-white">Target Users</h3>
                 </div>
                 <p className="text-gray-400 text-sm ml-4 line-clamp-2">Nutrition Tracking, Scanning, Meal Log</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-12 text-center bg-black">
         <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} NutriCal Track. Built for Health.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
