import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import client from '../api/client';

const CLASS_COLORS = {
    'caries leve':     '#22c55e',
    'caries moderada': '#eab308',
    'caries severa':   '#ef4444',
    'sin caries':      '#3b82f6',
};

export default function Dashboard() {
    const [preview,    setPreview]    = useState(null);
    const [file,       setFile]       = useState(null);
    const [resultado,  setResultado]  = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');
    const [dragging,   setDragging]   = useState(false);
    const inputRef = useRef();

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setResultado(null);
        setError('');
        setPreview(URL.createObjectURL(f));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleAnalizar = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        try {
            const form = new FormData();
            form.append('imagen', file);
            const { data } = await client.post('/api/predict', form);
            setResultado(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al analizar la imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleNuevo = () => {
        setFile(null);
        setPreview(null);
        setResultado(null);
        setError('');
    };

    return (
        <div className="page">
            <Navbar />
            <main className="main-content">
                <div className="page-header">
                    <h2 className="page-title">Análisis de imagen</h2>
                    <p className="page-desc">Sube una fotografía clínica intraoral para detectar caries automáticamente.</p>
                </div>

                {!resultado ? (
                    <div className="upload-section">
                        <div
                            className={`drop-zone ${dragging ? 'dragging' : ''} ${preview ? 'has-image' : ''}`}
                            onClick={() => inputRef.current.click()}
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                        >
                            {preview
                                ? <img src={preview} alt="Vista previa" className="preview-img" />
                                : (
                                    <div className="drop-placeholder">
                                        <span className="drop-icon">📷</span>
                                        <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
                                        <span className="drop-hint">JPG, PNG, BMP — máx. 10 MB</span>
                                    </div>
                                )
                            }
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/bmp,image/webp"
                            style={{ display: 'none' }}
                            onChange={e => handleFile(e.target.files[0])}
                        />
                        {error && <p className="form-error">{error}</p>}
                        {file && (
                            <div className="upload-actions">
                                <button className="btn-secondary" onClick={handleNuevo}>Cancelar</button>
                                <button className="btn-primary" onClick={handleAnalizar} disabled={loading}>
                                    {loading ? 'Analizando...' : 'Analizar imagen'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="result-section">
                        <div className="result-grid">
                            <div className="result-image-card">
                                <h3 className="card-title">Imagen analizada</h3>
                                <img
                                    src={`data:image/jpeg;base64,${resultado.image_base64}`}
                                    alt="Resultado"
                                    className="result-img"
                                />
                            </div>
                            <div className="result-detections-card">
                                <h3 className="card-title">
                                    Detecciones
                                    <span className="detection-count">{resultado.total_detections}</span>
                                </h3>
                                {resultado.total_detections === 0 ? (
                                    <p className="no-detections">No se detectaron lesiones con el umbral actual.</p>
                                ) : (
                                    <ul className="detection-list">
                                        {resultado.detections.map((d, i) => (
                                            <li key={i} className="detection-item">
                                                <span
                                                    className="detection-badge"
                                                    style={{ background: CLASS_COLORS[d.class] || '#6b7280' }}
                                                >
                                                    {d.class}
                                                </span>
                                                <span className="detection-conf">
                                                    {(d.confidence * 100).toFixed(1)}% confianza
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <div className="legend">
                                    {Object.entries(CLASS_COLORS).map(([cls, color]) => (
                                        <div key={cls} className="legend-item">
                                            <span className="legend-dot" style={{ background: color }} />
                                            <span>{cls}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button className="btn-primary" onClick={handleNuevo}>
                            Nueva imagen
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
