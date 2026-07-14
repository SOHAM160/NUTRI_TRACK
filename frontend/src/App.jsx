import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MealsPage from './pages/dashboard/MealsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import AiChatPage from './pages/dashboard/AiChatPage';
import GroceryPage from './pages/dashboard/GroceryPage';
import MealPlannerPage from './pages/dashboard/MealPlannerPage';
import GutHealthPage from './pages/dashboard/GutHealthPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="meals" element={<MealsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="ai" element={<AiChatPage />} />
              <Route path="grocery" element={<GroceryPage />} />
              <Route path="meal-planner" element={<MealPlannerPage />} />
              <Route path="gut-health" element={<GutHealthPage />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass text-sm text-dark-800 font-medium',
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
