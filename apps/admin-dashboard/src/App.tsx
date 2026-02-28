import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute, AdminLayout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrdersMonitor } from './pages/OrdersMonitor';
import { ManagementPage } from './pages/ManagementPage';
import { FleetManagement } from './pages/FleetManagement';
import { CouponsPage } from './pages/CouponsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PayoutsPage } from './pages/PayoutsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersMonitor />} />
            <Route path="/users" element={<ManagementPage type="users" />} />
            <Route path="/stores" element={<ManagementPage type="stores" />} />
            <Route path="/drivers" element={<FleetManagement />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
