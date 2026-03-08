import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Rooms from './pages/Rooms/Rooms';
import Reservations from './pages/Reservations/Reservations';
import Housekeeping from './pages/Housekeeping/Housekeeping';
import Folio from './pages/Folio/Folio';
import Login from './pages/Auth/Login';
import Departments from './pages/Departments/Departments';
import RoomTypes from './pages/RoomTypes/RoomTypes';
import Guests from './pages/Guests/Guests';
import Employees from './pages/Employees/Employees';
import Inventory from './pages/Inventory/Inventory';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './index.css';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - All require at least being logged in */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                {/* Main */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/" element={<Dashboard />} />
                </Route>

                {/* Operations */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/reservations" element={<Reservations />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/guests" element={<Guests />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING']} />}>
                    <Route path="/housekeeping" element={<Housekeeping />} />
                </Route>

                {/* Financials */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/folio" element={<Folio />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER']} />}>
                    <Route path="/reports" element={<div>Reports Page (Coming Soon)</div>} />
                </Route>

                {/* System */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN']} />}>
                    <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/room-types" element={<RoomTypes />} /> {/* Added route */}
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/inventory" element={<Inventory />} />
                </Route>

              </Routes>
            </MainLayout>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
