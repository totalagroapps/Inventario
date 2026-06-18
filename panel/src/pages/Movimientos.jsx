import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../api';

const Movimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    fetchMovimientos();
  }, [filtroTipo]);

  const fetchMovimientos = async () => {
    try {
      const params = {};
      if (filtroTipo) params.tipo = filtroTipo;
      const res = await api.get('/api/movimientos/', { params });
      setMovimientos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || '';
      const url = `${baseURL}/api/movimientos/export/csv`;
      const token = localStorage.getItem('panel_token');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Error exportando CSV");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'movimientos_inventario.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error al descargar CSV");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>Historial de Movimientos</h1>
        <button className="btn btn-outline" onClick={handleExportCSV}>
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="card mb-4 flex items-center gap-4">
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ display: 'inline-block', marginRight: '1rem' }}>Filtrar Tipo:</label>
          <select className="input" style={{ width: 'auto', display: 'inline-block' }} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Código</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Responsable</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7">Cargando...</td></tr> : 
              movimientos.map(mov => (
              <tr key={mov.id} style={{ backgroundColor: mov.tipo === 'entrada' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                <td style={{ color: 'var(--text-secondary)' }}>{new Date(mov.fecha).toLocaleString()}</td>
                <td>{mov.referencia?.nombre}</td>
                <td style={{ fontWeight: 600 }}>{mov.referencia?.codigo}</td>
                <td>
                  <span className={`badge ${mov.tipo === 'entrada' ? 'badge-info' : 'badge-danger'}`}>
                    {mov.tipo.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{mov.cantidad}</td>
                <td>{mov.responsable}</td>
                <td>{mov.observacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Movimientos;
