import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TripPlansProvider } from './contexts/TripPlansContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlanEditor from './pages/PlanEditor';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripPlansProvider>
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/:planId"
            element={
              <ProtectedRoute>
                <PlanEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan/new"
            element={
              <ProtectedRoute>
                <PlanEditor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TripPlansProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App

