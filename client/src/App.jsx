import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Renters from './pages/Renters';
import Payments from './pages/Payments';
import Billing from './pages/Billing';
import History from './pages/History';
import TenantDetails from './pages/TenantDetails';
import RenterDashboard from './pages/RenterDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Admin routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/renter-login" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="renters" element={<Renters />} />
            <Route path="payments" element={<Payments />} />
            <Route path="billing" element={<Billing />} />
            <Route path="history" element={<History />} />
            <Route path="tenant/:id" element={<TenantDetails />} />
          </Route>
          <Route path="/renter/dashboard" element={<RenterDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
