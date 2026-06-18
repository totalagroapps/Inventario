import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data.rol !== 'admin') {
        setError('Acceso denegado: Se requieren permisos de administrador');
        return;
      }

      localStorage.setItem('panel_token', response.data.access_token);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--sidebar-bg)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '2rem' }}>GAMS Admin</h2>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '2.5rem', backgroundColor: '#0f172a', color: 'white', borderColor: '#334155' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ color: '#cbd5e1' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: '2.5rem', backgroundColor: '#0f172a', color: 'white', borderColor: '#334155' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
