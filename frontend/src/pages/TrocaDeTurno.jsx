import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaArchive, FaClock, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './TrocaDeTurno.css';

// --- Modal para Adicionar/Editar Troca de Turno ---
const ShiftChangeModal = ({ onClose, onSave, existingShift }) => {
  const [shift, setShift] = useState(
    existingShift || {
      description: '',
      shift_date: new Date().toISOString().split('T')[0],
      shift_time: '',
      status: 'Aprovado'
    }
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShift(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(shift, !!existingShift);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingShift ? 'Editar' : 'Nova'} Troca de Turno</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição da Troca *</label>
            <textarea 
              name="description" 
              rows="4" 
              value={shift.description} 
              onChange={handleChange}
              placeholder="Descreva a troca de turno (ex: Trocar turno noturno por matutino, etc.)"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Data do Turno *</label>
              <input 
                name="shift_date" 
                type="date" 
                value={shift.shift_date} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Horário *</label>
              <input 
                name="shift_time" 
                type="time" 
                value={shift.shift_time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          {/* Status removido do formulário de edição conforme solicitado */}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>
              Cancelar
            </button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Salvando...' : (existingShift ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Modal para Ver Histórico ---
const HistoryModal = ({ shift, onClose, onView }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onView) {
      onView(shift.id);
    }
  }, [shift.id, onView]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shift_change_history')
          .select('*')
          .eq('shift_change_id', shift.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        toast.error('Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [shift.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <h2>Histórico da Troca de Turno</h2>
        <div className="history-list">
          {loading && <p>Carregando...</p>}
          {!loading && history.length === 0 && <p>Nenhum histórico encontrado.</p>}
          {!loading && history.map(item => (
            <div key={item.id} className="history-item">
              <p className="history-item-description">{item.event_description}</p>
              <p className="history-item-meta">
                {new Date(item.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" onClick={onClose} className="form-button">Fechar</button>
        </div>
      </div>
    </div>
  );
};

// --- Modal de Visualização (somente leitura) ---
const ViewShiftModal = ({ shift, onClose, onView }) => {
  useEffect(() => {
    if (onView && shift?.id) onView(shift.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift?.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Detalhes da Troca de Turno</h2>
        <div className="form-group">
          <label>Data e Hora</label>
          <input type="text" readOnly value={`${shift?.shift_date || ''} ${shift?.shift_time || ''}`} />
        </div>
        <div className="form-group">
          <label>Descrição</label>
          <textarea readOnly rows="4" value={shift?.description || ''} />
        </div>
        <div className="form-group">
          <label>Criado por</label>
          <input type="text" readOnly value={shift?.creator_name || 'Usuário'} />
        </div>
        {shift?.viewers && shift.viewers.length > 0 && (
          <div className="form-group">
            <label>Visualizado por</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {shift.viewers.map(v => (
                <span key={v.userId} className="chip" title={`${v.name} • ${new Date(v.at).toLocaleString('pt-BR')}`}>{v.name.split(' ')[0]}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="form-button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---
function TrocaDeTurno() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [archivedShifts, setArchivedShifts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, shift: null });
  const [showArchived, setShowArchived] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const [activeShiftsRes, archivedShiftsRes, profilesRes, viewsRes] = await Promise.all([
        supabase
          .from('shift_changes')
          .select('*')
          .neq('status', 'Arquivado')
          .order('created_at', { ascending: false }),
        supabase
          .from('shift_changes')
          .select('*')
          .eq('status', 'Arquivado')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('shift_change_views').select('shift_change_id, viewed_by, created_at')
      ]);
      
      if (activeShiftsRes.error) throw activeShiftsRes.error;
      if (archivedShiftsRes.error) throw archivedShiftsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      const profileById = {};
      (profilesRes.data || []).forEach(p => { profileById[p.id] = p; });
      const viewsByShift = {};
      const viewsRows = viewsRes?.error ? [] : (viewsRes.data || []);
      // Deduplica por usuário mantendo a visualização mais recente
      viewsRows.forEach(v => {
        const viewer = profileById[v.viewed_by];
        const entry = {
          userId: v.viewed_by,
          name: viewer?.full_name || v.viewed_by,
          avatarUrl: viewer?.avatar_url || null,
          at: v.created_at,
        };
        if (!viewsByShift[v.shift_change_id]) {
          viewsByShift[v.shift_change_id] = new Map([[v.viewed_by, entry]]);
        } else {
          const existing = viewsByShift[v.shift_change_id].get(v.viewed_by);
          if (!existing || new Date(entry.at) > new Date(existing.at)) {
            viewsByShift[v.shift_change_id].set(v.viewed_by, entry);
          }
        }
      });
      const attach = (arr) => (arr || []).map(s => ({
        ...s,
        creator_name: profileById[s.created_by]?.full_name || 'Usuário',
        viewers: viewsByShift[s.id] ? Array.from(viewsByShift[s.id].values()).sort((a,b)=> new Date(b.at)-new Date(a.at)) : []
      }));
      setShifts(attach(activeShiftsRes.data));
      setArchivedShifts(attach(archivedShiftsRes.data));
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar trocas de turno:', error);
      toast.error('Erro ao carregar trocas de turno');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleSaveShift = async (shiftData, isEditing) => {
    const toastId = toast.loading(isEditing ? 'Atualizando...' : 'Criando troca de turno...');
    try {
      let error;
      if (isEditing) {
        const { id, description, shift_date, shift_time, status } = shiftData;
        const payload = { description, shift_date, shift_time, status };
        const { error: updateError } = await supabase
          .from('shift_changes')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { description, shift_date, shift_time, status } = shiftData;
        const payload = { description, shift_date, shift_time, status };
        const { error: insertError } = await supabase
          .from('shift_changes')
          .insert({ ...payload, created_by: user.id });
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success(`Troca de turno ${isEditing ? 'atualizada' : 'criada'}!`, { id: toastId });
      fetchShifts();
      return true;
    } catch (error) {
      toast.error('Erro: ' + error.message, { id: toastId });
      return false;
    }
  };

  const handleArchiveShift = async (shiftId) => {
    if (window.confirm('Tem certeza que deseja arquivar esta troca de turno?')) {
      const toastId = toast.loading('Arquivando...');
      try {
        const { error } = await supabase
          .from('shift_changes')
          .update({ status: 'Arquivado' })
          .eq('id', shiftId);
        
        if (error) throw error;
        
        toast.success('Troca de turno arquivada!', { id: toastId });
        fetchShifts();
      } catch (error) {
        toast.error('Erro ao arquivar: ' + error.message, { id: toastId });
      }
    }
  };

  const handleUnarchiveShift = async (shiftId) => {
    const toastId = toast.loading('Desarquivando...');
    try {
      const { error } = await supabase
        .from('shift_changes')
        .update({ status: 'Aprovado' })
        .eq('id', shiftId);
      
      if (error) throw error;
      
      toast.success('Troca de turno desarquivada!', { id: toastId });
      fetchShifts();
    } catch (error) {
      toast.error('Erro ao desarquivar: ' + error.message, { id: toastId });
    }
  };

  const recordView = async (shiftId) => {
    try {
      const { error } = await supabase
        .from('shift_change_views')
        .upsert({ shift_change_id: shiftId, viewed_by: user.id }, { onConflict: 'shift_change_id,viewed_by' });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const optimisticAddViewer = (shiftId) => {
    setShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const exists = (s.viewers || []).some(v => v.userId === user.id);
      if (exists) return s;
      const viewer = { userId: user.id, name: profiles.find(p => p.id === user.id)?.full_name || 'Você', at: new Date().toISOString(), avatarUrl: null };
      return { ...s, viewers: [viewer, ...(s.viewers || [])] };
    }));
    setArchivedShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const exists = (s.viewers || []).some(v => v.userId === user.id);
      if (exists) return s;
      const viewer = { userId: user.id, name: profiles.find(p => p.id === user.id)?.full_name || 'Você', at: new Date().toISOString(), avatarUrl: null };
      return { ...s, viewers: [viewer, ...(s.viewers || [])] };
    }));
  };

  const getStatusClass = (status) => {
    if (status === 'Arquivado') return 'status-arquivado';
    return 'status-aprovado';
  };

  // Evita bug de fuso: formata data (YYYY-MM-DD) e hora (HH:MM) sem criar Date()
  const formatShiftDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '---';
    const [year, month, day] = String(dateStr).split('-').map(n => parseInt(n, 10));
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yy = String(year).slice(-2);
    const [hh = '00', min = '00'] = String(timeStr || '').split(':');
    return `${dd}/${mm}/${yy} - ${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const formatIsoDateTimeBR = (isoString) => {
    if (!isoString) return '---';
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} às ${hh}:${min}`;
  };

  // Visibilidade automática: registra visualização quando o card estiver 60% visível
  const observerRef = useRef(null);
  const viewedSetRef = useRef(new Set());
  useEffect(() => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        if (!visibleEnough) return;
        const shiftId = entry.target.getAttribute('data-shift-id');
        if (!shiftId) return;
        const alreadySession = viewedSetRef.current.has(shiftId);
        const shiftObj = [...shifts, ...archivedShifts].find(s => String(s.id) === String(shiftId));
        const alreadyViewed = (shiftObj?.viewers || []).some(v => v.userId === user.id);
        if (!alreadyViewed && !alreadySession) {
          viewedSetRef.current.add(shiftId);
          optimisticAddViewer(shiftId);
          recordView(shiftId);
        }
      });
    }, { threshold: [0.4], rootMargin: '0px 0px -20% 0px' });

    const all = [...shifts, ...archivedShifts];
    all.forEach((s) => {
      const el = document.getElementById(`shift-card-${s.id}`);
      if (el) {
        el.setAttribute('data-shift-id', String(s.id));
        observerRef.current.observe(el);
      }
    });

    // Registro imediato ao abrir a página para os cards visíveis atualmente
    requestAnimationFrame(() => {
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const allNow = [...shifts, ...archivedShifts];
      allNow.forEach(s => {
        const el = document.getElementById(`shift-card-${s.id}`);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const height = rect.height || 1;
        const visible = Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0));
        const ratio = visible / height;
        if (ratio >= 0.4) {
          optimisticAddViewer(s.id);
          recordView(s.id);
          viewedSetRef.current.add(String(s.id));
        }
      });
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [shifts, archivedShifts, loading, user.id]);

  if (loading) return <div className="loading-state">Carregando trocas de turno...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>🔄 Troca de Turno</h1>
        <div className="search-and-actions">
          <button 
            className="form-button archive-toggle"
            onClick={() => setShowArchived(!showArchived)}
            style={{ background: showArchived ? 'var(--warning-color)' : 'var(--secondary-text-color)' }}
          >
            {showArchived ? <FaEyeSlash /> : <FaEye />}
            {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
          </button>
          <button className="form-button" onClick={() => setModalState({ type: 'add', shift: null })}>
            <FaPlus style={{ marginRight: '8px' }} />
            Nova Troca
          </button>
        </div>
      </div>

      <div className="shift-changes-content">
        {/* Trocas Ativas */}
        {!showArchived && (
          <>
            <h2 className="section-title">Trocas Ativas</h2>
            {shifts.length > 0 ? (
              <div className="shifts-grid">
                {shifts.map(shift => (
                  <div
                    key={shift.id}
                    id={`shift-card-${shift.id}`}
                    className="shift-card"
                    onClick={() => setModalState({ type: 'view', shift })}
                    title="Clique para ver detalhes"
                  >
                    <div className="shift-header" />
                    
                    <div className="shift-details">
                      <div className="shift-info">
                        <FaCalendarAlt className="shift-icon" />
                        <span>{formatShiftDateTime(shift.shift_date, shift.shift_time)}</span>
                      </div>
                      
                      <p className="shift-description">{shift.description}</p>
                      
                      <div className="shift-meta">
                        <span className="shift-created">Criado por: {shift.creator_name}, em {formatIsoDateTimeBR(shift.created_at)}</span>
                        {shift.viewers && shift.viewers.length > 0 && (
                          <span className="shift-viewers">
                            Visualizado por: {shift.viewers.map(v => v.name.split(' ')[0]).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shift-actions">
                      <div className="shift-actions-left">
                        <button 
                          className="action-btn edit"
                          onClick={(e) => { e.stopPropagation(); setModalState({ type: 'edit', shift }); }}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        
                        {/* Botão Ver histórico removido */}
                        <button 
                          className="action-btn archive"
                          onClick={(e) => { e.stopPropagation(); handleArchiveShift(shift.id); }}
                          title="Arquivar"
                        >
                          <FaArchive />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaClock />
                </div>
                <h3>Nenhuma troca de turno ativa</h3>
                <p>Crie uma nova troca de turno para começar.</p>
              </div>
            )}
          </>
        )}

        {/* Trocas Arquivadas */}
        {showArchived && (
          <>
            <h2 className="section-title">Trocas Arquivadas</h2>
            {archivedShifts.length > 0 ? (
              <div className="shifts-grid">
                {archivedShifts.map(shift => (
                  <div key={shift.id} id={`shift-card-${shift.id}`} className="shift-card archived">
                    <div className="shift-header" />
                    
                    <div className="shift-details">
                      <div className="shift-info">
                        <FaCalendarAlt className="shift-icon" />
                        <span>{formatShiftDateTime(shift.shift_date, shift.shift_time)}</span>
                      </div>
                      
                      <p className="shift-description">{shift.description}</p>
                      
                      <div className="shift-meta">
                        <span className="shift-created">Criado por: {shift.creator_name}, em {formatIsoDateTimeBR(shift.created_at)}</span>
                        <span className="shift-updated">Arquivado em: {formatIsoDateTimeBR(shift.updated_at)}</span>
                        {shift.viewers && shift.viewers.length > 0 && (
                          <span className="shift-viewers">
                            Visualizado por: {shift.viewers.map(v => v.name.split(' ')[0]).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shift-actions">
                      <div className="shift-actions-left">
                        {/* Botão Ver histórico removido */}
                        <button 
                          className="action-btn unarchive"
                          onClick={() => handleUnarchiveShift(shift.id)}
                          title="Desarquivar"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaArchive />
                </div>
                <h3>Nenhuma troca arquivada</h3>
                <p>Não há trocas de turno arquivadas.</p>
              </div>
            )}
          </>
        )}
      </div>

      {modalState.type === 'add' && (
        <ShiftChangeModal 
          onClose={() => setModalState({ type: null, shift: null })} 
          onSave={handleSaveShift} 
        />
      )}
      
      {modalState.type === 'edit' && (
        <ShiftChangeModal 
          onClose={() => setModalState({ type: null, shift: null })} 
          onSave={handleSaveShift} 
          existingShift={modalState.shift} 
        />
      )}
      
      {modalState.type === 'history' && (
        <HistoryModal
          shift={modalState.shift}
          onClose={() => setModalState({ type: null, shift: null })}
          onView={recordView}
        />
      )}

      {modalState.type === 'view' && (
        <ViewShiftModal
          shift={modalState.shift}
          onClose={() => setModalState({ type: null, shift: null })}
          onView={recordView}
        />
      )}
    </div>
  );
}

export default TrocaDeTurno;