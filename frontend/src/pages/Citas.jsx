import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';

const ESTADO_COLOR = { pendiente: '#eab308', completada: '#16a34a', cancelada: '#dc2626' };

function fmtDatetime(s) {
    if (!s) return '—';
    return new Date(s).toLocaleString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ModalNuevaCita({ pacientes, onClose, onCreada }) {
    const [form, setForm] = useState({ paciente_id: '', fecha_hora: '', motivo: '', estado: 'pendiente', notas: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async (e) => {
        e.preventDefault();
        if (!form.paciente_id || !form.fecha_hora) { setError('Paciente y fecha/hora son obligatorios'); return; }
        setLoading(true);
        try {
            await client.post('/api/citas', form);
            onCreada();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al crear cita');
        } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 500 }}>
                <div className="modal-header">
                    <h3>Nueva cita</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={guardar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label>Paciente *</label>
                        <select value={form.paciente_id} onChange={e => set('paciente_id', e.target.value)}>
                            <option value="">Seleccionar paciente...</option>
                            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
                        </select>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group"><label>Fecha y hora *</label><input type="datetime-local" value={form.fecha_hora} onChange={e => set('fecha_hora', e.target.value)} /></div>
                        <div className="form-group"><label>Estado</label>
                            <select value={form.estado} onChange={e => set('estado', e.target.value)}>
                                <option value="pendiente">Pendiente</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label>Motivo</label><input value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Control, extracción, blanqueamiento..." /></div>
                    <div className="form-group"><label>Notas</label><textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
                    {error && <p className="form-error">{error}</p>}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cita'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Citas() {
    const [citas, setCitas]         = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [estado, setEstado]       = useState('');
    const [modal, setModal]         = useState(false);
    const navigate = useNavigate();

    const cargar = async () => {
        setLoading(true);
        try {
            const params = estado ? `?estado=${estado}` : '';
            const [{ data: c }, { data: p }] = await Promise.all([
                client.get(`/api/citas${params}`),
                client.get('/api/pacientes'),
            ]);
            setCitas(c);
            setPacientes(p);
        } finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, [estado]);

    const cambiarEstado = async (cita, nuevoEstado) => {
        await client.put(`/api/citas/${cita.id}`, { ...cita, estado: nuevoEstado });
        cargar();
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta cita?')) return;
        await client.delete(`/api/citas/${id}`);
        cargar();
    };

    const pendientes  = citas.filter(c => c.estado === 'pendiente').length;
    const completadas = citas.filter(c => c.estado === 'completada').length;

    return (
        <div className="page">
            <Navbar />
            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 className="page-title">Citas</h2>
                        <p className="page-desc">Agenda y seguimiento de citas odontológicas.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setModal(true)}>+ Nueva cita</button>
                </div>

                {/* Resumen */}
                <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card"><div className="stat-num">{citas.length}</div><div className="stat-label">Total</div></div>
                    <div className="stat-card"><div className="stat-num" style={{ color: '#eab308' }}>{pendientes}</div><div className="stat-label">Pendientes</div></div>
                    <div className="stat-card"><div className="stat-num" style={{ color: '#16a34a' }}>{completadas}</div><div className="stat-label">Completadas</div></div>
                </div>

                {/* Filtro */}
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    {['', 'pendiente', 'completada', 'cancelada'].map(e => (
                        <button key={e} className={`filter-chip ${estado === e ? 'active' : ''}`} onClick={() => setEstado(e)}>
                            {e === '' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="loading-text">Cargando citas...</p>
                ) : citas.length === 0 ? (
                    <div className="empty-state"><span>📅</span><p>Sin citas {estado ? `con estado "${estado}"` : 'registradas'}.</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                        {citas.map(c => (
                            <div key={c.id} className="clinic-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.3rem', flexWrap: 'wrap' }}>
                                            <span className="estado-badge" style={{ background: `${ESTADO_COLOR[c.estado]}22`, color: ESTADO_COLOR[c.estado], border: `1px solid ${ESTADO_COLOR[c.estado]}44` }}>
                                                {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                                            </span>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', fontSize: '.9rem', padding: 0 }}
                                                onClick={() => navigate(`/pacientes/${c.paciente_id}`)}
                                            >
                                                {c.paciente_nombre}
                                            </button>
                                        </div>
                                        <div style={{ fontWeight: 600 }}>{fmtDatetime(c.fecha_hora)}</div>
                                        {c.motivo && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{c.motivo}</p>}
                                        {c.notas  && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>{c.notas}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                        {c.estado === 'pendiente' && <>
                                            <button className="btn-ver" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => cambiarEstado(c, 'completada')}>Completar</button>
                                            <button className="btn-ver" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => cambiarEstado(c, 'cancelada')}>Cancelar</button>
                                        </>}
                                        <button className="btn-danger-sm" onClick={() => eliminar(c.id)}>✕</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            {modal && <ModalNuevaCita pacientes={pacientes} onClose={() => setModal(false)} onCreada={() => { setModal(false); cargar(); }} />}
        </div>
    );
}
