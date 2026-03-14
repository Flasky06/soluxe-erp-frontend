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
import Venues from './pages/Venues/Venues';
import Kitchen from './pages/Kitchen/Kitchen';
import Restaurant from './pages/Restaurant/Restaurant';
import POS from './pages/POS/POS';
import Settings from './pages/Settings/Settings';
import Reports from './pages/Reports/Reports';
import Expenses from './pages/Expenses/Expenses';
import ExpenseTypes from './pages/ExpenseTypes/ExpenseTypes';
import Tables from './pages/Tables/Tables';
import MenuItems from './pages/MenuItems/MenuItems';
import Suppliers from './pages/Suppliers/Suppliers';
import InventoryCategories from './pages/InventoryCategories/InventoryCategories';
import Users from './pages/Users/Users';
import MenuCategories from './pages/MenuCategories/MenuCategories';
import CheckOut from './pages/CheckOut/CheckOut';
import CheckIn from './pages/CheckIn/CheckIn';
import Maintenance from './pages/Maintenance/Maintenance';
import VenueBookings from './pages/VenueBookings/VenueBookings';
import ChargeTypes from './pages/ChargeTypes/ChargeTypes';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import InventoryUnits from './pages/InventoryUnits/InventoryUnits';
import LeaveTypes from './pages/LeaveTypes/LeaveTypes';
import MaintenanceIssueTypes from './pages/MaintenanceIssueTypes/MaintenanceIssueTypes';
import Attendance from './pages/Attendance/Attendance';
import LeaveRequests from './pages/LeaveRequests/LeaveRequests';
import PurchaseOrders from './pages/PurchaseOrders/PurchaseOrders';
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
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Dashboard />} />
                </Route>

                {/* Operations */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/reservations" element={<Reservations />} />
                    <Route path="/check-in" element={<CheckIn />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/guests" element={<Guests />} />
                    <Route path="/check-out" element={<CheckOut />} />
                    <Route path="/venues" element={<Venues />} />
                    <Route path="/venue-bookings" element={<VenueBookings />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/housekeeping" element={<Housekeeping />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_MAINTENANCE', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/maintenance" element={<Maintenance />} />
                    <Route path="/maintenance-issue-types" element={<MaintenanceIssueTypes />} />
                </Route>

                {/* Financials */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT']} />}>
                    <Route path="/folio" element={<Folio />} />
                    <Route path="/charge-types" element={<ChargeTypes />} />
                    <Route path="/payment-methods" element={<PaymentMethods />} />
                    <Route path="/expense-types" element={<ExpenseTypes />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_CHEF']} />}>
                    <Route path="/kitchen" element={<Kitchen />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER', 'ROLE_CASHIER']} />}>
                    <Route path="/restaurant" element={<Restaurant />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER', 'ROLE_CASHIER', 'ROLE_RECEPTIONIST']} />}>
                    <Route path="/pos" element={<POS />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT']} />}>
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/expenses" element={<Expenses />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER']} />}>
                    <Route path="/menu-items" element={<MenuItems />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER']} />}>
                    <Route path="/menu-categories" element={<MenuCategories />} />
                    <Route path="/tables" element={<Tables />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER']} />}>
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/inventory-categories" element={<InventoryCategories />} />
                    <Route path="/inventory-units" element={<InventoryUnits />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/purchase-orders" element={<PurchaseOrders />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/leave-requests" element={<LeaveRequests />} />
                </Route>

                {/* System */}
                <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN']} />}>
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/room-types" element={<RoomTypes />} /> 
                    <Route path="/leave-types" element={<LeaveTypes />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/users" element={<Users />} />
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
