import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="navbar-icon">🦷</span>
                <span className="navbar-title">Cindy Dent</span>
            </div>
            <div className="navbar-links">
                <Link to="/"          className={`nav-link ${location.pathname === '/'          ? 'active' : ''}`}>Análisis</Link>
                <Link to="/historial" className={`nav-link ${location.pathname === '/historial' ? 'active' : ''}`}>Historial</Link>
            </div>
            <div className="navbar-user">
                <span className="user-name">{user?.nombre}</span>
                <button onClick={handleLogout} className="btn-logout">Salir</button>
            </div>
        </nav>
    );
}
