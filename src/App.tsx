import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import LoginPage from '@/pages/Login';

import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminResellers from '@/pages/admin/Resellers';
import AdminResellerDetail from '@/pages/admin/ResellerDetail';
import AdminRequests from '@/pages/admin/Requests';
import AdminCredits from '@/pages/admin/Credits';
import AdminHistory from '@/pages/admin/History';
import AdminActivity from '@/pages/admin/Activity';
import AdminSettings from '@/pages/admin/Settings';

import ResellerLayout from '@/layouts/ResellerLayout';
import ResellerDashboard from '@/pages/reseller/Dashboard';
import ResellerAddEmail from '@/pages/reseller/AddEmail';
import ResellerMyRequests from '@/pages/reseller/MyRequests';
import ResellerHistory from '@/pages/reseller/History';
import ResellerProfile from '@/pages/reseller/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#161c27',
              border: '1px solid #2a3341',
              color: '#e7ecf3',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="revendedores" element={<AdminResellers />} />
            <Route path="revendedores/:id" element={<AdminResellerDetail />} />
            <Route path="solicitudes" element={<AdminRequests />} />
            <Route path="creditos" element={<AdminCredits />} />
            <Route path="historial" element={<AdminHistory />} />
            <Route path="actividad" element={<AdminActivity />} />
            <Route path="configuracion" element={<AdminSettings />} />
          </Route>

          <Route
            path="/reseller"
            element={
              <ProtectedRoute role="reseller">
                <ResellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ResellerDashboard />} />
            <Route path="agregar-correo" element={<ResellerAddEmail />} />
            <Route path="mis-solicitudes" element={<ResellerMyRequests />} />
            <Route path="historial" element={<ResellerHistory />} />
            <Route path="perfil" element={<ResellerProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
