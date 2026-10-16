import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';

const ESTADO_COLOR  = { pendiente: '#eab308', completada: '#16a34a', cancelada: '#dc2626' };
const ESTADO_BG     = { pendiente: '#fefce8', completada: '#f0fdf4', cancelada: '#fef2f2' };
const DIAS_SEMANA   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES         = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtDatetime(s) {
    if (!s) return '—';
    return new Date(s).toLocaleString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtHour(s) {
    if (!s) return '';
    return new Date(s).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}
function toKey(date) {
    return date.toISOString().slice(0, 10);
}

/* ─── Modal nueva cita ─── */
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

/* ─── Calendario mensual ─── */
function CalendarioMes({ citas, onSelectDia }) {
    const hoy = new Date();
    const [year, setYear]   = useState(hoy.getFullYear());
    const [month, setMonth] = useState(hoy.getMonth());

    const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    // Agrupar citas por fecha YYYY-MM-DD
    const citasPorDia = {};
    citas.forEach(c => {
        const key = new Date(c.fecha_hora).toISOString().slice(0, 10);
        if (!citasPorDia[key]) citasPorDia[key] = [];
        citasPorDia[key].push(c);
    });

    // Celdas del calendario
    const primerDia  = new Date(year, month, 1).getDay();
    const diasMes    = new Date(year, month + 1, 0).getDate();
    const celdas     = [];
    for (let i = 0; i < primerDia; i++) celdas.push(null);
    for (let d = 1; d <= diasMes; d++) celdas.push(d);
    while (celdas.length % 7 !== 0) celdas.push(null);

    const hoyKey = toKey(hoy);

    return (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Cabecera mes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <button onClick={prev} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', padding: '0 .5rem' }}>‹</button>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{MESES[month]} {year}</span>
                <button onClick={next} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', padding: '0 .5rem' }}>›</button>
            </div>

            {/* Días de la semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
                {DIAS_SEMANA.map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '.5rem 0', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg)' }}>{d}</div>
                ))}
            </div>

            {/* Celdas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {celdas.map((dia, i) => {
                    if (!dia) return <div key={`e${i}`} style={{ minHeight: 80, background: 'var(--bg)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', opacity: .3 }} />;
                    const key   = `${year}-${String(month + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
                    const dCitas = citasPorDia[key] || [];
                    const esHoy = key === hoyKey;
                    return (
                        <div
                            key={key}
                            onClick={() => dCitas.length > 0 && onSelectDia(key, dCitas)}
                            style={{
                                minHeight: 80,
                                padding: '.4rem .5rem',
                                borderRight: '1px solid var(--border)',
                                borderBottom: '1px solid var(--border)',
                                cursor: dCitas.length > 0 ? 'pointer' : 'default',
                                background: esHoy ? 'rgba(37,99,235,.06)' : 'var(--card-bg)',
                                transition: 'background .15s',
                            }}
                            onMouseEnter={e => { if (dCitas.length) e.currentTarget.style.background = 'rgba(37,99,235,.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = esHoy ? 'rgba(37,99,235,.06)' : 'var(--card-bg)'; }}
                        >
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 26, height: 26, borderRadius: '50%', fontSize: '.82rem', fontWeight: esHoy ? 700 : 400,
                                background: esHoy ? 'var(--primary)' : 'transparent',
                                color: esHoy ? '#fff' : 'var(--text)',
                            }}>{dia}</span>

                            {/* Eventos del día */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
                                {dCitas.slice(0, 3).map(c => (
                                    <div key={c.id} style={{
                                        fontSize: '.68rem', padding: '1px 4px', borderRadius: 4, fontWeight: 600,
                                        background: ESTADO_BG[c.estado], color: ESTADO_COLOR[c.estado],
                                        border: `1px solid ${ESTADO_COLOR[c.estado]}44`,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {fmtHour(c.fecha_hora)} {c.paciente_nombre?.split(' ')[0]}
                                    </div>
                                ))}
                                {dCitas.length > 3 && (
                                    <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', paddingLeft: 4 }}>+{dCitas.length - 3} más</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Panel lateral: citas del día seleccionado ─── */
function PanelDia({ diaKey, citas, onClose, onCambiarEstado, onEliminar, navigate }) {
    const fecha = new Date(diaKey + 'T12:00:00');
    const titulo = fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,.4)',
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: 'var(--card-bg)', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>{titulo}</div>
                        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{citas.length} cita{citas.length !== 1 ? 's' : ''}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {citas.map(c => (
                        <div key={c.id} style={{ padding: '1rem', borderRadius: 10, border: `1px solid ${ESTADO_COLOR[c.estado]}44`, background: ESTADO_BG[c.estado] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{fmtHour(c.fecha_hora)}</span>
                                <span className="estado-badge" style={{ background: `${ESTADO_COLOR[c.estado]}22`, color: ESTADO_COLOR[c.estado], border: `1px solid ${ESTADO_COLOR[c.estado]}55` }}>
                                    {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                                </span>
                            </div>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', padding: 0, fontSize: '.9rem' }}
                                onClick={() => navigate(`/pacientes/${c.paciente_id}`)}>
                                {c.paciente_nombre}
                            </button>
                            {c.motivo && <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>{c.motivo}</p>}
                            {c.notas  && <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{c.notas}</p>}
                            {c.estado === 'pendiente' && (
                                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                                    <button className="btn-ver" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => onCambiarEstado(c, 'completada')}>Completar</button>
                                    <button className="btn-ver" style={{ background: '#fee2e2', color: '#dc2626' }} onClick={() => onCambiarEstado(c, 'cancelada')}>Cancelar</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─── Página principal ─── */
export default function Citas() {
    const [citas, setCitas]         = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [estado, setEstado]       = useState('');
    const [modal, setModal]         = useState(false);
    const [vista, setVista]         = useState('calendario'); // 'lista' | 'calendario'
    const [diaSeleccionado, setDiaSeleccionado] = useState(null); // { key, citas }
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
        setDiaSeleccionado(null);
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
                {/* Cabecera */}
                <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 className="page-title">Citas</h2>
                        <p className="page-desc">Agenda y seguimiento de citas odontológicas.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Toggle vista */}
                        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                            {[['calendario','📅 Calendario'],['lista','☰ Lista']].map(([v, label]) => (
                                <button key={v} onClick={() => setVista(v)} style={{
                                    padding: '.45rem .9rem', border: 'none', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600,
                                    background: vista === v ? 'var(--primary)' : 'var(--card-bg)',
                                    color: vista === v ? '#fff' : 'var(--text-muted)',
                                    transition: 'all .15s',
                                }}>{label}</button>
                            ))}
                        </div>
                        <button className="btn-primary" onClick={() => setModal(true)}>+ Nueva cita</button>
                    </div>
                </div>

                {/* Resumen */}
                <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card"><div className="stat-num">{citas.length}</div><div className="stat-label">Total</div></div>
                    <div className="stat-card"><div className="stat-num" style={{ color: '#eab308' }}>{pendientes}</div><div className="stat-label">Pendientes</div></div>
                    <div className="stat-card"><div className="stat-num" style={{ color: '#16a34a' }}>{completadas}</div><div className="stat-label">Completadas</div></div>
                </div>

                {loading ? (
                    <p className="loading-text">Cargando citas...</p>
                ) : vista === 'calendario' ? (
                    <>
                        {/* Leyenda */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {Object.entries(ESTADO_COLOR).map(([e, color]) => (
                                <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                                    {e.charAt(0).toUpperCase() + e.slice(1)}
                                </div>
                            ))}
                            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>· Haz clic en un día con citas para ver el detalle</span>
                        </div>
                        <CalendarioMes
                            citas={citas}
                            onSelectDia={(key, dCitas) => setDiaSeleccionado({ key, citas: dCitas })}
                        />
                    </>
                ) : (
                    <>
                        {/* Filtro */}
                        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            {['', 'pendiente', 'completada', 'cancelada'].map(e => (
                                <button key={e} className={`filter-chip ${estado === e ? 'active' : ''}`} onClick={() => setEstado(e)}>
                                    {e === '' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
                                </button>
                            ))}
                        </div>
                        {citas.length === 0 ? (
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
                                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)', fontSize: '.9rem', padding: 0 }}
                                                        onClick={() => navigate(`/pacientes/${c.paciente_id}`)}>
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
                    </>
                )}
            </main>

            {modal && <ModalNuevaCita pacientes={pacientes} onClose={() => setModal(false)} onCreada={() => { setModal(false); cargar(); }} />}

            {diaSeleccionado && (
                <PanelDia
                    diaKey={diaSeleccionado.key}
                    citas={diaSeleccionado.citas}
                    onClose={() => setDiaSeleccionado(null)}
                    onCambiarEstado={cambiarEstado}
                    onEliminar={eliminar}
                    navigate={navigate}
                />
            )}
        </div>
    );
}
