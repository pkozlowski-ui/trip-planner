import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TripPlansProvider } from './contexts/TripPlansContext';
import Dashboard from './pages/Dashboard';
import PlanEditor from './pages/PlanEditor';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TripPlansProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan/:planId" element={<PlanEditor />} />
            <Route path="/plan/new" element={<PlanEditor />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TripPlansProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App

