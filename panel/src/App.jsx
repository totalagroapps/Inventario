import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, Activity, QrCode, Scale, LogOut } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Referencias from './pages/Referencias';
import Movimientos from './pages/Movimientos';
import QRSheet from './pages/QRSheet';
import ReportePeso from './pages/ReportePeso';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('panel_token');
  return token ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('panel_token');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <PackageSearch size={24} color="#10b981" />
          GAMS Admin
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/referencias" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <PackageSearch size={20} /> Referencias
          </NavLink>
          <NavLink to="/movimientos" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Activity size={20} /> Movimientos
          </NavLink>
          <NavLink to="/qr-sheet" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <QrCode size={20} /> Hoja QR
          </NavLink>
          <NavLink to="/reporte-peso" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Scale size={20} /> Reporte Peso
          </NavLink>
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', color: '#94a3b8', borderColor: '#334155' }}>
            <LogOut size={18} /> Salir
          </button>
        </div>
      </div>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router basename="/panel">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/referencias" element={<PrivateRoute><Layout><Referencias /></Layout></PrivateRoute>} />
        <Route path="/movimientos" element={<PrivateRoute><Layout><Movimientos /></Layout></PrivateRoute>} />
        <Route path="/qr-sheet" element={<PrivateRoute><Layout><QRSheet /></Layout></PrivateRoute>} />
        <Route path="/reporte-peso" element={<PrivateRoute><Layout><ReportePeso /></Layout></PrivateRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
