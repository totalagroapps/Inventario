import { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import api from '../api';

const QRSheet = () => {
  const [referencias, setReferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState('');
  const [categoriasUnicas, setCategoriasUnicas] = useState([]);

  useEffect(() => {
    fetchReferencias();
  }, [categoria]);

  const fetchReferencias = async () => {
    try {
      // Fetch all to get unique categories if not loaded
      const res = await api.get('/api/referencias/', { params: { limit: 1000 } });
      const allRefs = res.data;
      
      if (categoriasUnicas.length === 0) {
        const unique = [...new Set(allRefs.map(r => r.categoria).filter(Boolean))];
        setCategoriasUnicas(unique);
      }

      if (categoria) {
        setReferencias(allRefs.filter(r => r.categoria === categoria));
      } else {
        setReferencias(allRefs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const backendUrl = import.meta.env.VITE_API_URL || '';

  return (
    <div>
      <div className="top-actions flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>Hoja de Etiquetas QR</h1>
        <div className="flex gap-4">
          <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categoriasUnicas.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {loading ? <div>Cargando QR...</div> : 
          referencias.filter(r => r.qr_path).map(ref => (
          <div key={ref.id} style={{
            border: '1px dashed #cbd5e1',
            padding: '1rem',
            textAlign: 'center',
            backgroundColor: 'white',
            pageBreakInside: 'avoid',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <img 
              src={`${backendUrl}${ref.qr_path}`} 
              alt={`QR ${ref.codigo}`} 
              style={{ width: '150px', height: '150px', objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white; }
          .app-container { display: block; }
          .sidebar, .top-actions { display: none !important; }
          .main-content { padding: 0; }
        }
      `}} />
    </div>
  );
};

export default QRSheet;
