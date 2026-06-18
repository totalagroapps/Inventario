import { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/api/dashboard/resumen');
      setData(response.data);
    } catch (err) {
      console.error("Error al cargar dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando dashboard...</div>;
  if (!data) return <div>Error al cargar datos</div>;

  return (
    <div>
      <h1 className="page-title">Resumen de Inventario</h1>
      
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="flex items-center gap-2">
            <Package size={20} color="var(--primary)" />
            <span className="stat-title">Total Referencias</span>
          </div>
          <span className="stat-value">{data.total_referencias}</span>
        </div>
        
        <div className="card stat-card">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={20} color="var(--info)" />
            <span className="stat-title">Entradas Hoy</span>
          </div>
          <span className="stat-value">{data.entradas_hoy}</span>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2">
            <ArrowDownRight size={20} color="var(--danger)" />
            <span className="stat-title">Salidas Hoy</span>
          </div>
          <span className="stat-value">{data.salidas_hoy}</span>
        </div>

        <div className="card stat-card">
          <div className="flex items-center gap-2">
            <DollarSign size={20} color="var(--warning)" />
            <span className="stat-title">Valor Inventario</span>
          </div>
          <span className="stat-value">
            ${data.valor_inventario_total.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Alertas Bajo Mínimo */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="var(--danger)" /> Referencias Bajo Mínimo
          </h2>
          {data.bajo_minimo.length === 0 ? (
            <div className="card" style={{ color: 'var(--text-secondary)' }}>No hay referencias bajo el stock mínimo.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bajo_minimo.map(ref => (
                    <tr key={ref.id}>
                      <td style={{ fontWeight: 600 }}>{ref.codigo}</td>
                      <td>{ref.nombre}</td>
                      <td>
                        <span className="badge badge-danger">{ref.stock_actual}</span>
                      </td>
                      <td>{ref.stock_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimos Movimientos */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Últimos Movimientos</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cant.</th>
                  <th>Ref.</th>
                </tr>
              </thead>
              <tbody>
                {data.movimientos_recientes.map(mov => (
                  <tr key={mov.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(mov.fecha).toLocaleString()}
                    </td>
                    <td>
                      {mov.tipo === 'entrada' ? (
                        <span className="badge badge-info">Entrada</span>
                      ) : (
                        <span className="badge badge-danger">Salida</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{mov.cantidad}</td>
                    <td>{mov.referencia?.codigo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
