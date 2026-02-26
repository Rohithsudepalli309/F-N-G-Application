import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute, AdminLayout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrdersMonitor } from './pages/OrdersMonitor';
import { ManagementPage } from './pages/ManagementPage';
import { FleetManagement } from './pages/FleetManagement';

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
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
