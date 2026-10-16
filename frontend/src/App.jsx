import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import History        from './pages/History';
import Pacientes      from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import Citas          from './pages/Citas';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/historial" element={
                        <ProtectedRoute><History /></ProtectedRoute>
                    } />
                    <Route path="/pacientes" element={
                        <ProtectedRoute><Pacientes /></ProtectedRoute>
                    } />
                    <Route path="/pacientes/:id" element={
                        <ProtectedRoute><PacienteDetalle /></ProtectedRoute>
                    } />
                    <Route path="/citas" element={
                        <ProtectedRoute><Citas /></ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
