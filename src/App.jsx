import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Rooms from './pages/Rooms/Rooms';
import Reservations from './pages/Reservations/Reservations';
import Housekeeping from './pages/Housekeeping/Housekeeping';
import Folio from './pages/Folio/Folio';
import Login from './pages/Auth/Login';
import Guests from './pages/Guests/Guests';
import RoomTypes from './pages/RoomTypes/RoomTypes';
import Users from './pages/Users/Users';
import Settings from './pages/Settings/Settings';
import ChargeTypes from './pages/ChargeTypes/ChargeTypes';
import PaymentMethods from './pages/PaymentMethods/PaymentMethods';
import Reports from './pages/Reports/Reports';
import CheckIn from './pages/CheckIn/CheckIn';
import CheckOut from './pages/CheckOut/CheckOut';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Keycards from './pages/Keycards/Keycards';
import Overview from './pages/Overview/Overview';
import Venues from './pages/Venues/Venues';
import VenueBookings from './pages/VenueBookings/VenueBookings';


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - All require at least being logged in */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
              {/* Main */}
              <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/overview" element={<Overview />} />
              </Route>

              {/* Operations */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST']} />}>
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/check-in" element={<CheckIn />} />
                  <Route path="/rooms" element={<Rooms />} />
                  <Route path="/guests" element={<Guests />} />
                  <Route path="/check-out" element={<CheckOut />} />
                  <Route path="/keycards" element={<Keycards />} />
                  <Route path="/venues" element={<Venues />} />
                  <Route path="/venue-bookings" element={<VenueBookings />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST']} />}>
                  <Route path="/housekeeping" element={<Housekeeping />} />
              </Route>
              {/* Financials */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT']} />}>
                  <Route path="/folio" element={<Folio />} />
                  <Route path="/charge-types" element={<ChargeTypes />} />
                  <Route path="/payment-methods" element={<PaymentMethods />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT']} />}>
                  <Route path="/reports" element={<Reports />} />
              </Route>
              {/* System */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_HOTEL_ADMIN']} />}>
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/room-types" element={<RoomTypes />} /> 
                  <Route path="/users" element={<Users />} />
              </Route>

          </Route>
        </Route>
        
        {/* Catch-all undefined routes and redirect to root (helps prevent blank screens) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
