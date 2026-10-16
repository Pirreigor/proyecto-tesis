import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';

const SEXO_LABEL = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };

function calcEdad(fecha) {
    if (!fecha) return '—';
    const diff = Date.now() - new Date(fecha).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' años';
}

function ModalNuevoPaciente({ onClose, onCreado }) {
    const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', sexo: '', telefono: '', email: '', direccion: '', notas: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son obligatorios'); return; }
        setLoading(true);
        try {
            const { data } = await client.post('/api/pacientes', form);
            onCreado(data.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear paciente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 560 }}>
                <div className="modal-header">
                    <h3>Nuevo paciente</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Nombre *</label>
                            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Ana" />
                        </div>
                        <div className="form-group">
                            <label>Apellido *</label>
                            <input value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Ej: Torres" />
                        </div>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Fecha de nacimiento</label>
                            <input type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Sexo</label>
                            <select value={form.sexo} onChange={e => set('sexo', e.target.value)}>
                                <option value="">—</option>
                                <option value="masculino">Masculino</option>
                                <option value="femenino">Femenino</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+51 900 000 000" />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@ejemplo.com" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Dirección</label>
                        <input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, ciudad..." />
                    </div>
                    <div className="form-group">
                        <label>Notas</label>
                        <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} placeholder="Observaciones generales..." style={{ resize: 'vertical' }} />
                    </div>
                    {error && <p className="form-error">{error}</p>}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar paciente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [buscar, setBuscar]     = useState('');
    const [modal, setModal]       = useState(false);
    const navigate = useNavigate();

    const cargar = async () => {
        try {
            const { data } = await client.get('/api/pacientes');
            setPacientes(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const filtrados = pacientes.filter(p => {
        const q = buscar.toLowerCase();
        return `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
               (p.telefono || '').includes(q) ||
               (p.email || '').toLowerCase().includes(q);
    });

    const handleCreado = (id) => {
        setModal(false);
        navigate(`/pacientes/${id}`);
    };

    return (
        <div className="page">
            <Navbar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 className="page-title">Pacientes</h2>
                        <p className="page-desc">Gestiona el registro de tus pacientes y su historial clínico.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setModal(true)}>+ Nuevo paciente</button>
                </div>

                <div className="search-bar">
                    <input
                        className="search-input"
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                </div>

                {loading ? (
                    <p className="loading-text">Cargando pacientes...</p>
                ) : filtrados.length === 0 ? (
                    <div className="empty-state">
                        <span>🦷</span>
                        <p>{buscar ? 'Sin resultados para esa búsqueda.' : 'Aún no tienes pacientes registrados.'}</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Paciente</th>
                                    <th>Edad / Sexo</th>
                                    <th>Teléfono</th>
                                    <th>Citas</th>
                                    <th>Análisis</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((p, i) => (
                                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/pacientes/${p.id}`)}>
                                        <td className="td-num">{i + 1}</td>
                                        <td>
                                            <div className="td-name">{p.nombre} {p.apellido}</div>
                                            {p.email && <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{p.email}</div>}
                                        </td>
                                        <td style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                                            {calcEdad(p.fecha_nacimiento)}{p.sexo ? ` · ${SEXO_LABEL[p.sexo] || p.sexo}` : ''}
                                        </td>
                                        <td style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{p.telefono || '—'}</td>
                                        <td className="td-count"><span className="count-badge">{p.total_citas}</span></td>
                                        <td className="td-count"><span className="count-badge">{p.total_analisis}</span></td>
                                        <td>
                                            <button className="btn-ver" onClick={e => { e.stopPropagation(); navigate(`/pacientes/${p.id}`); }}>Ver</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
            {modal && <ModalNuevoPaciente onClose={() => setModal(false)} onCreado={handleCreado} />}
        </div>
    );
}
