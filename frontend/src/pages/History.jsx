import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import client from '../api/client';

const CLASS_COLORS = {
    'caries leve':     '#22c55e',
    'caries moderada': '#eab308',
    'caries severa':   '#ef4444',
    'sin caries':      '#3b82f6',
};

function formatDate(iso) {
    return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function History() {
    const [historial, setHistorial] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [selected,  setSelected]  = useState(null);
    const [detalle,   setDetalle]   = useState(null);
    const [loadingDet, setLoadingDet] = useState(false);

    useEffect(() => {
        client.get('/api/history')
            .then(r => setHistorial(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const verDetalle = async (id) => {
        setSelected(id);
        setDetalle(null);
        setLoadingDet(true);
        try {
            const { data } = await client.get(`/api/history/${id}`);
            setDetalle(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDet(false);
        }
    };

    const cerrar = () => { setSelected(null); setDetalle(null); };

    return (
        <div className="page">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <h2 className="page-title">Historial de análisis</h2>
                    <p className="page-desc">Registro de todas las imágenes procesadas con el modelo YOLOv8s.</p>
                </div>

                {loading ? (
                    <p className="loading-text">Cargando historial...</p>
                ) : historial.length === 0 ? (
                    <div className="empty-state">
                        <span>📋</span>
                        <p>Aún no hay análisis registrados.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Imagen</th>
                                    <th>Detecciones</th>
                                    <th>Fecha</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map((a, i) => (
                                    <tr key={a.id}>
                                        <td className="td-num">{i + 1}</td>
                                        <td className="td-name">{a.nombre_imagen || '—'}</td>
                                        <td className="td-count">
                                            <span className="count-badge">{a.total_detecciones}</span>
                                        </td>
                                        <td className="td-date">{formatDate(a.creado_en)}</td>
                                        <td>
                                            <button className="btn-ver" onClick={() => verDetalle(a.id)}>
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal de detalle */}
            {selected && (
                <div className="modal-overlay" onClick={cerrar}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalle del análisis</h3>
                            <button className="modal-close" onClick={cerrar}>✕</button>
                        </div>
                        {loadingDet ? (
                            <p className="loading-text">Cargando...</p>
                        ) : detalle && (
                            <div className="modal-body">
                                <img
                                    src={`data:image/jpeg;base64,${detalle.resultado_base64}`}
                                    alt="Resultado"
                                    className="modal-img"
                                />
                                <div className="modal-detections">
                                    <p className="modal-meta">
                                        <strong>{detalle.nombre_imagen}</strong> &mdash; {formatDate(detalle.creado_en)}
                                    </p>
                                    {detalle.total_detecciones === 0 ? (
                                        <p>Sin detecciones.</p>
                                    ) : (
                                        <ul className="detection-list">
                                            {(typeof detalle.detecciones === 'string'
                                                ? JSON.parse(detalle.detecciones)
                                                : detalle.detecciones
                                            ).map((d, i) => (
                                                <li key={i} className="detection-item">
                                                    <span
                                                        className="detection-badge"
                                                        style={{ background: CLASS_COLORS[d.class] || '#6b7280' }}
                                                    >{d.class}</span>
                                                    <span className="detection-conf">
                                                        {(d.confidence * 100).toFixed(1)}% confianza
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
