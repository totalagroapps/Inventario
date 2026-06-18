import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, QrCode, X } from 'lucide-react';
import api from '../api';

const Referencias = () => {
  const [referencias, setReferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [stockBajo, setStockBajo] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, path: '', name: '' });
  
  const [formData, setFormData] = useState({
    id: '', nombre: '', codigo: '', categoria: '', 
    unidad: 'unidad', peso_unitario_gr: 0, precio_unitario: 0,
    stock_actual: 0, stock_minimo: 5
  });

  useEffect(() => {
    fetchReferencias();
  }, [buscar, stockBajo]);

  const fetchReferencias = async () => {
    try {
      const res = await api.get('/api/referencias/', {
        params: { buscar, stock_bajo: stockBajo ? 'true' : undefined }
      });
      setReferencias(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ref) => {
    setFormData(ref);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Seguro que deseas eliminar esta referencia?')) {
      await api.delete(`/api/referencias/${id}`);
      fetchReferencias();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/api/referencias/${formData.id}`, formData);
      } else {
        await api.post('/api/referencias/', formData);
      }
      setModalOpen(false);
      fetchReferencias();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al guardar");
    }
  };

  const openNewModal = () => {
    setFormData({
      id: '', nombre: '', codigo: '', categoria: '', 
      unidad: 'unidad', peso_unitario_gr: 0, precio_unitario: 0,
      stock_actual: 0, stock_minimo: 5
    });
    setModalOpen(true);
  };

  const backendUrl = import.meta.env.VITE_API_URL || '';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>Gestión de Referencias</h1>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} /> Nueva Referencia
        </button>
      </div>

      <div className="card mb-4 flex items-center gap-4">
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Buscar por nombre o código..." 
            style={{ paddingLeft: '2.5rem' }}
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontWeight: 500 }}>
          <input 
            type="checkbox" 
            checked={stockBajo} 
            onChange={(e) => setStockBajo(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
          Solo bajo mínimo
        </label>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Peso (g)</th>
              <th>Precio ($)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7">Cargando...</td></tr> : 
              referencias.map(ref => (
              <tr key={ref.id}>
                <td style={{ fontWeight: 600 }}>{ref.codigo}</td>
                <td>{ref.nombre}</td>
                <td>{ref.categoria}</td>
                <td>
                  <span className={`badge ${ref.stock_actual <= ref.stock_minimo ? (ref.stock_actual === 0 ? 'badge-secondary' : 'badge-danger') : 'badge-success'}`}>
                    {ref.stock_actual}
                  </span>
                </td>
                <td>{ref.peso_unitario_gr}</td>
                <td>{ref.precio_unitario}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-outline" style={{ padding: '0.4rem' }} title="Ver QR" onClick={() => setQrModal({ open: true, path: ref.qr_path, name: ref.nombre })}>
                      <QrCode size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--info)' }} title="Editar" onClick={() => handleEdit(ref)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Eliminar" onClick={() => handleDelete(ref.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{formData.id ? 'Editar' : 'Nueva'} Referencia</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" className="input" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Código</label>
                  <input type="text" className="input" required value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Categoría</label>
                  <input type="text" className="input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock Actual</label>
                  <input type="number" className="input" required value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: parseInt(e.target.value)})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock Mínimo</label>
                  <input type="number" className="input" required value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Peso Unitario (g)</label>
                  <input type="number" step="0.01" className="input" value={formData.peso_unitario_gr} onChange={e => setFormData({...formData, peso_unitario_gr: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Precio Unitario</label>
                  <input type="number" step="0.01" className="input" value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal.open && (
        <div className="modal-overlay" onClick={() => setQrModal({open: false, path: '', name: ''})}>
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '350px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>QR - {qrModal.name}</h3>
            <img src={`${backendUrl}${qrModal.path}`} alt="QR Code" style={{ width: '100%', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.5rem' }} />
            <a href={`${backendUrl}${qrModal.path}`} download className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>Descargar PNG</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referencias;
