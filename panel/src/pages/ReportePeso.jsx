import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../api';

const ReportePeso = () => {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReporte();
  }, []);

  const fetchReporte = async () => {
    try {
      const res = await api.get('/api/referencias/reporte-peso');
      setReporte(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const header = ['Codigo', 'Nombre', 'Stock', 'Peso Unit (g)', 'Peso Total (kg)', 'Precio Unit', 'Precio Total'];
    const rows = reporte.map(r => [
      r.codigo, r.nombre, r.stock_actual, r.peso_unitario_gr, r.peso_total_kg.toFixed(3),
      r.precio_unitario, r.precio_total.toFixed(2)
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + header.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_valorizacion.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const totalKg = reporte.reduce((acc, curr) => acc + curr.peso_total_kg, 0);
  const totalVal = reporte.reduce((acc, curr) => acc + curr.precio_total, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>Reporte de Peso y Valorización</h1>
        <button className="btn btn-outline" onClick={handleExportCSV}>
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="card stat-card" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
          <span className="stat-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Peso Total en Bodega</span>
          <span className="stat-value" style={{ color: 'white' }}>{totalKg.toFixed(2)} kg</span>
        </div>
        <div className="card stat-card" style={{ backgroundColor: 'var(--info)', color: 'white' }}>
          <span className="stat-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Valor Total Inventario</span>
          <span className="stat-value" style={{ color: 'white' }}>${totalVal.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th style={{ textAlign: 'right' }}>Stock</th>
              <th style={{ textAlign: 'right' }}>Peso Unit (g)</th>
              <th style={{ textAlign: 'right' }}>Peso Total (kg)</th>
              <th style={{ textAlign: 'right' }}>Precio Unit</th>
              <th style={{ textAlign: 'right' }}>Precio Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7">Cargando...</td></tr> : 
              reporte.map(row => (
              <tr key={row.id}>
                <td style={{ fontWeight: 600 }}>{row.codigo}</td>
                <td>{row.nombre}</td>
                <td style={{ textAlign: 'right' }}>{row.stock_actual}</td>
                <td style={{ textAlign: 'right' }}>{row.peso_unitario_gr}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{row.peso_total_kg.toFixed(3)}</td>
                <td style={{ textAlign: 'right' }}>${row.precio_unitario}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>${row.precio_total.toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportePeso;
