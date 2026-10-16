import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import client from '../api/client';

const TABS = ['Info', 'Condiciones', 'Citas', 'Tratamientos', 'Prescripciones', 'Análisis IA'];
const ESTADO_COLOR = { pendiente: '#eab308', completada: '#16a34a', cancelada: '#dc2626', planificado: '#6366f1', en_curso: '#f97316', completado: '#16a34a' };
const SEXO_LABEL   = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };

function calcEdad(fecha) {
    if (!fecha) return '—';
    const diff = Date.now() - new Date(fecha).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' años';
}
function fmtFecha(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDatetime(s) {
    if (!s) return '—';
    return new Date(s).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Sección Info ─────────────────────────────────────────────────────────────
function TabInfo({ paciente, onActualizar }) {
    const [editando, setEditando] = useState(false);
    const [form, setForm]         = useState({ ...paciente });
    const [loading, setLoading]   = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async () => {
        setLoading(true);
        try {
            await client.put(`/api/pacientes/${paciente.id}`, form);
            onActualizar();
            setEditando(false);
        } finally {
            setLoading(false);
        }
    };

    if (!editando) return (
        <div className="detalle-grid">
            <InfoRow label="Nombre completo"   value={`${paciente.nombre} ${paciente.apellido}`} />
            <InfoRow label="Fecha nacimiento"  value={`${fmtFecha(paciente.fecha_nacimiento)} (${calcEdad(paciente.fecha_nacimiento)})`} />
            <InfoRow label="Sexo"              value={SEXO_LABEL[paciente.sexo] || '—'} />
            <InfoRow label="Teléfono"          value={paciente.telefono || '—'} />
            <InfoRow label="Email"             value={paciente.email || '—'} />
            <InfoRow label="Dirección"         value={paciente.direccion || '—'} />
            <InfoRow label="Notas"             value={paciente.notas || '—'} full />
            <div style={{ gridColumn: '1/-1', marginTop: '.5rem' }}>
                <button className="btn-secondary" onClick={() => setEditando(true)}>Editar datos</button>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row-2">
                <div className="form-group"><label>Nombre</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
                <div className="form-group"><label>Apellido</label><input value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
            </div>
            <div className="form-row-2">
                <div className="form-group"><label>Fecha nacimiento</label><input type="date" value={form.fecha_nacimiento?.split('T')[0] || ''} onChange={e => set('fecha_nacimiento', e.target.value)} /></div>
                <div className="form-group"><label>Sexo</label>
                    <select value={form.sexo || ''} onChange={e => set('sexo', e.target.value)}>
                        <option value="">—</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
            </div>
            <div className="form-row-2">
                <div className="form-group"><label>Teléfono</label><input value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Dirección</label><input value={form.direccion || ''} onChange={e => set('direccion', e.target.value)} /></div>
            <div className="form-group"><label>Notas</label><textarea value={form.notas || ''} onChange={e => set('notas', e.target.value)} rows={3} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                <button className="btn-primary" onClick={guardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </div>
    );
}

function InfoRow({ label, value, full }) {
    return (
        <div style={{ gridColumn: full ? '1/-1' : undefined }}>
            <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.2rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
            <div style={{ fontSize: '.95rem' }}>{value}</div>
        </div>
    );
}

// ── Condiciones ──────────────────────────────────────────────────────────────
function TabCondiciones({ pacienteId, condiciones, onRefresh }) {
    const [form, setForm]   = useState({ condicion: '', descripcion: '', fecha_diagnostico: '', activa: true });
    const [show, setShow]   = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.condicion.trim()) return;
        setLoading(true);
        try {
            await client.post(`/api/pacientes/${pacienteId}/condiciones`, form);
            setForm({ condicion: '', descripcion: '', fecha_diagnostico: '', activa: true });
            setShow(false);
            onRefresh();
        } finally { setLoading(false); }
    };

    const toggle = async (c) => {
        await client.put(`/api/pacientes/${pacienteId}/condiciones/${c.id}`, { ...c, activa: !c.activa });
        onRefresh();
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta condición?')) return;
        await client.delete(`/api/pacientes/${pacienteId}/condiciones/${id}`);
        onRefresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={() => setShow(!show)}>+ Agregar condición</button>
            </div>
            {show && (
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="form-group"><label>Condición *</label><input value={form.condicion} onChange={e => set('condicion', e.target.value)} placeholder="Ej: Diabetes tipo 2, Hipertensión..." /></div>
                    <div className="form-row-2" style={{ marginTop: '1rem' }}>
                        <div className="form-group"><label>Descripción</label><input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} /></div>
                        <div className="form-group"><label>Fecha diagnóstico</label><input type="date" value={form.fecha_diagnostico} onChange={e => set('fecha_diagnostico', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setShow(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={guardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
            )}
            {condiciones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Sin condiciones registradas.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {condiciones.map(c => (
                        <div key={c.id} className="clinic-card" style={{ opacity: c.activa ? 1 : .6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div>
                                    <span className="estado-badge" style={{ background: c.activa ? '#fef2f2' : '#f1f5f9', color: c.activa ? '#dc2626' : '#64748b', border: `1px solid ${c.activa ? '#fecaca' : '#e2e8f0'}` }}>
                                        {c.activa ? 'Activa' : 'Resuelta'}
                                    </span>
                                    <strong style={{ marginLeft: '.75rem' }}>{c.condicion}</strong>
                                    {c.descripcion && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>{c.descripcion}</p>}
                                    {c.fecha_diagnostico && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Diagnóstico: {fmtFecha(c.fecha_diagnostico)}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                                    <button className="btn-ver" onClick={() => toggle(c)}>{c.activa ? 'Marcar resuelta' : 'Reactivar'}</button>
                                    <button className="btn-danger-sm" onClick={() => eliminar(c.id)}>✕</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Citas ────────────────────────────────────────────────────────────────────
function TabCitas({ pacienteId, citas, onRefresh }) {
    const [form, setForm]   = useState({ fecha_hora: '', motivo: '', estado: 'pendiente', notas: '' });
    const [show, setShow]   = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.fecha_hora) return;
        setLoading(true);
        try {
            await client.post('/api/citas', { ...form, paciente_id: pacienteId });
            setForm({ fecha_hora: '', motivo: '', estado: 'pendiente', notas: '' });
            setShow(false);
            onRefresh();
        } finally { setLoading(false); }
    };

    const cambiarEstado = async (cita, estado) => {
        await client.put(`/api/citas/${cita.id}`, { ...cita, estado });
        onRefresh();
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta cita?')) return;
        await client.delete(`/api/citas/${id}`);
        onRefresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={() => setShow(!show)}>+ Nueva cita</button>
            </div>
            {show && (
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
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
                    <div className="form-group" style={{ marginTop: '1rem' }}><label>Motivo</label><input value={form.motivo} onChange={e => set('motivo', e.target.value)} placeholder="Control, extracción, ortodoncia..." /></div>
                    <div className="form-group" style={{ marginTop: '1rem' }}><label>Notas</label><textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setShow(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={guardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
            )}
            {citas.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Sin citas registradas.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {citas.map(c => (
                        <div key={c.id} className="clinic-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <span className="estado-badge" style={{ background: `${ESTADO_COLOR[c.estado]}22`, color: ESTADO_COLOR[c.estado], border: `1px solid ${ESTADO_COLOR[c.estado]}44` }}>
                                        {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                                    </span>
                                    <strong style={{ marginLeft: '.75rem' }}>{fmtDatetime(c.fecha_hora)}</strong>
                                    {c.motivo && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>{c.motivo}</p>}
                                    {c.notas  && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{c.notas}</p>}
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
        </div>
    );
}

// ── Tratamientos ─────────────────────────────────────────────────────────────
function TabTratamientos({ pacienteId, tratamientos, onRefresh }) {
    const [form, setForm]   = useState({ nombre: '', descripcion: '', diente: '', estado: 'planificado', costo: '', fecha_inicio: '', fecha_fin: '' });
    const [show, setShow]   = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.nombre.trim()) return;
        setLoading(true);
        try {
            await client.post('/api/tratamientos', { ...form, paciente_id: pacienteId });
            setForm({ nombre: '', descripcion: '', diente: '', estado: 'planificado', costo: '', fecha_inicio: '', fecha_fin: '' });
            setShow(false);
            onRefresh();
        } finally { setLoading(false); }
    };

    const cambiarEstado = async (t, estado) => {
        await client.put(`/api/tratamientos/${t.id}`, { ...t, estado });
        onRefresh();
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este tratamiento?')) return;
        await client.delete(`/api/tratamientos/${id}`);
        onRefresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={() => setShow(!show)}>+ Nuevo tratamiento</button>
            </div>
            {show && (
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="form-row-2">
                        <div className="form-group"><label>Tratamiento *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Extracción, endodoncia..." /></div>
                        <div className="form-group"><label>Diente (Nº FDI)</label><input value={form.diente} onChange={e => set('diente', e.target.value)} placeholder="Ej: 11, 26, 37..." /></div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}><label>Descripción</label><textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} style={{ resize: 'vertical' }} /></div>
                    <div className="form-row-3" style={{ marginTop: '1rem' }}>
                        <div className="form-group"><label>Estado</label>
                            <select value={form.estado} onChange={e => set('estado', e.target.value)}>
                                <option value="planificado">Planificado</option>
                                <option value="en_curso">En curso</option>
                                <option value="completado">Completado</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Costo (S/)</label><input type="number" step="0.01" value={form.costo} onChange={e => set('costo', e.target.value)} placeholder="0.00" /></div>
                        <div className="form-group"><label>Fecha inicio</label><input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setShow(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={guardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
            )}
            {tratamientos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Sin tratamientos registrados.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {tratamientos.map(t => (
                        <div key={t.id} className="clinic-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <span className="estado-badge" style={{ background: `${ESTADO_COLOR[t.estado]}22`, color: ESTADO_COLOR[t.estado], border: `1px solid ${ESTADO_COLOR[t.estado]}44` }}>
                                        {t.estado.replace('_', ' ')}
                                    </span>
                                    <strong style={{ marginLeft: '.75rem' }}>{t.nombre}</strong>
                                    {t.diente && <span style={{ marginLeft: '.5rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>Diente {t.diente}</span>}
                                    {t.descripcion && <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>{t.descripcion}</p>}
                                    <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                                        {t.costo ? `S/ ${parseFloat(t.costo).toFixed(2)}` : ''}
                                        {t.costo && t.fecha_inicio ? ' · ' : ''}
                                        {t.fecha_inicio ? `Inicio: ${fmtFecha(t.fecha_inicio)}` : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                                    {t.estado === 'planificado' && <button className="btn-ver" style={{ background: '#fff7ed', color: '#f97316' }} onClick={() => cambiarEstado(t, 'en_curso')}>Iniciar</button>}
                                    {t.estado === 'en_curso' && <button className="btn-ver" style={{ background: '#dcfce7', color: '#16a34a' }} onClick={() => cambiarEstado(t, 'completado')}>Completar</button>}
                                    <button className="btn-danger-sm" onClick={() => eliminar(t.id)}>✕</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Prescripciones ───────────────────────────────────────────────────────────
function TabPrescripciones({ pacienteId, prescripciones, onRefresh }) {
    const [form, setForm]   = useState({ medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '', fecha: '' });
    const [show, setShow]   = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.medicamento.trim()) return;
        setLoading(true);
        try {
            await client.post('/api/prescripciones', { ...form, paciente_id: pacienteId });
            setForm({ medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '', fecha: '' });
            setShow(false);
            onRefresh();
        } finally { setLoading(false); }
    };

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta prescripción?')) return;
        await client.delete(`/api/prescripciones/${id}`);
        onRefresh();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={() => setShow(!show)}>+ Nueva prescripción</button>
            </div>
            {show && (
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="form-row-2">
                        <div className="form-group"><label>Medicamento *</label><input value={form.medicamento} onChange={e => set('medicamento', e.target.value)} placeholder="Ej: Amoxicilina 500 mg" /></div>
                        <div className="form-group"><label>Dosis</label><input value={form.dosis} onChange={e => set('dosis', e.target.value)} placeholder="Ej: 1 cápsula" /></div>
                    </div>
                    <div className="form-row-3" style={{ marginTop: '1rem' }}>
                        <div className="form-group"><label>Frecuencia</label><input value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)} placeholder="Cada 8 horas" /></div>
                        <div className="form-group"><label>Duración</label><input value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="7 días" /></div>
                        <div className="form-group"><label>Fecha</label><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}><label>Indicaciones</label><textarea value={form.indicaciones} onChange={e => set('indicaciones', e.target.value)} rows={2} placeholder="Tomar con alimentos..." style={{ resize: 'vertical' }} /></div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn-secondary" onClick={() => setShow(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={guardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </div>
            )}
            {prescripciones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Sin prescripciones registradas.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {prescripciones.map(pr => (
                        <div key={pr.id} className="clinic-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div>
                                    <strong>💊 {pr.medicamento}</strong>
                                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {pr.dosis      && <span>Dosis: {pr.dosis}</span>}
                                        {pr.frecuencia && <span>· {pr.frecuencia}</span>}
                                        {pr.duracion   && <span>· {pr.duracion}</span>}
                                        {pr.fecha      && <span>· {fmtFecha(pr.fecha)}</span>}
                                    </div>
                                    {pr.indicaciones && <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{pr.indicaciones}</p>}
                                </div>
                                <button className="btn-danger-sm" onClick={() => eliminar(pr.id)}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Análisis IA ──────────────────────────────────────────────────────────────
function TabAnalisis({ analisis }) {
    return (
        <div>
            {analisis.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Sin análisis de IA vinculados a este paciente.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="history-table">
                        <thead><tr><th>#</th><th>Imagen</th><th>Detecciones</th><th>Fecha</th></tr></thead>
                        <tbody>
                            {analisis.map((a, i) => (
                                <tr key={a.id}>
                                    <td className="td-num">{i + 1}</td>
                                    <td className="td-name">{a.nombre_imagen || '—'}</td>
                                    <td className="td-count"><span className="count-badge">{a.total_detecciones}</span></td>
                                    <td className="td-date">{fmtDatetime(a.creado_en)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function PacienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab]     = useState(0);

    const cargar = useCallback(async () => {
        try {
            const { data: d } = await client.get(`/api/pacientes/${id}`);
            setData(d);
        } catch {
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { cargar(); }, [cargar]);

    if (loading) return <div className="page"><Navbar /><p className="loading-text">Cargando...</p></div>;
    if (!data)   return null;

    const { paciente, condiciones, citas, tratamientos, prescripciones, analisis } = data;
    const COUNTS = [null, condiciones.length, citas.length, tratamientos.length, prescripciones.length, analisis.length];

    return (
        <div className="page">
            <Navbar />
            <main className="main-content">
                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ padding: '.4rem .8rem', fontSize: '.85rem' }} onClick={() => navigate('/pacientes')}>← Volver</button>
                    <div style={{ flex: 1 }}>
                        <h2 className="page-title">{paciente.nombre} {paciente.apellido}</h2>
                        <p className="page-desc">
                            {calcEdad(paciente.fecha_nacimiento)}{paciente.sexo ? ` · ${SEXO_LABEL[paciente.sexo]}` : ''}
                            {paciente.telefono ? ` · ${paciente.telefono}` : ''}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-bar">
                    {TABS.map((t, i) => (
                        <button key={t} className={`tab-btn-page ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
                            {t}
                            {COUNTS[i] > 0 && <span className="tab-count">{COUNTS[i]}</span>}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {tab === 0 && <TabInfo paciente={paciente} onActualizar={cargar} />}
                    {tab === 1 && <TabCondiciones pacienteId={id} condiciones={condiciones} onRefresh={cargar} />}
                    {tab === 2 && <TabCitas pacienteId={id} citas={citas} onRefresh={cargar} />}
                    {tab === 3 && <TabTratamientos pacienteId={id} tratamientos={tratamientos} onRefresh={cargar} />}
                    {tab === 4 && <TabPrescripciones pacienteId={id} prescripciones={prescripciones} onRefresh={cargar} />}
                    {tab === 5 && <TabAnalisis analisis={analisis} />}
                </div>
            </main>
        </div>
    );
}
