import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaArchive, FaHistory, FaClock, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
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
      viewsRows.forEach(v => {
        if (!viewsByShift[v.shift_change_id]) viewsByShift[v.shift_change_id] = [];
        const viewer = profileById[v.viewed_by];
        viewsByShift[v.shift_change_id].push({
          name: viewer?.full_name || v.viewed_by,
          avatarUrl: viewer?.avatar_url || null,
          at: v.created_at
        });
      });
      const attach = (arr) => (arr || []).map(s => ({
        ...s,
        creator_name: profileById[s.created_by]?.full_name || 'Usuário',
        viewers: viewsByShift[s.id] || []
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
        const { error: updateError } = await supabase
          .from('shift_changes')
          .update(shiftData)
          .eq('id', shiftData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('shift_changes')
          .insert({ ...shiftData, created_by: user.id });
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
      await supabase
        .from('shift_change_views')
        .insert({
          shift_change_id: shiftId,
          viewed_by: user.id
        });
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'Arquivado') return 'status-arquivado';
    return 'status-aprovado';
  };

  const formatDateTime = (date, time) => {
    if (!date) return '---';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = time ? String(time).split(':')[0].padStart(2, '0') : '00';
    const min = time ? String(time).split(':')[1].padStart(2, '0') : '00';
    return `${dd}/${mm}/${yy} - ${hh}:${min}`;
  };

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
                  <div key={shift.id} className="shift-card">
                    <div className="shift-header" />
                    
                    <div className="shift-details">
                      <div className="shift-info" title={`${new Date(shift.shift_date).toISOString()} ${shift.shift_time || ''}`.trim()}>
                        <FaCalendarAlt className="shift-icon" />
                        <span>{formatDateTime(shift.shift_date, shift.shift_time)}</span>
                      </div>
                      
                      <p className="shift-description">{shift.description}</p>
                      
                      <div className="shift-meta">
                        <span className="shift-created">
                          Criado por: {shift.creator_name}
                        </span>
                        <span className="shift-created">
                          Criado em: {new Date(shift.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {shift.viewers && shift.viewers.length > 0 && (
                          <span className="shift-viewers" title={shift.viewers.map(v => `${v.name} • ${new Date(v.at).toISOString()}`).join('\n')}>
                            Visto por: {shift.viewers.slice(0, 3).map(v => v.name).join(', ')}{shift.viewers.length > 3 ? ` +${shift.viewers.length - 3}` : ''}
                          </span>
                        )}
                        {shift.updated_at !== shift.created_at && (
                          <span className="shift-updated">
                            Atualizado em: {new Date(shift.updated_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="shift-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => setModalState({ type: 'edit', shift: shift })}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      
                      <button 
                        className="action-btn history"
                        onClick={() => setModalState({ type: 'history', shift: shift })}
                        title="Ver histórico"
                      >
                        <FaHistory />
                      </button>

                      {shift.viewers && shift.viewers.length > 0 && (
                        <div className="viewers-avatars" style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                          {shift.viewers.slice(0, 5).map((v, idx) => (
                            v.avatarUrl ? (
                              <img key={idx} src={v.avatarUrl} title={`${v.name} • ${new Date(v.at).toISOString()}`} alt={v.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                            ) : (
                              <div key={idx} className="avatar-dot" title={`${v.name} • ${new Date(v.at).toISOString()}`}></div>
                            )
                          ))}
                        </div>
                      )}
                      
                      <button 
                        className="action-btn archive"
                        onClick={() => handleArchiveShift(shift.id)}
                        title="Arquivar"
                      >
                        <FaArchive />
                      </button>
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
                  <div key={shift.id} className="shift-card archived">
                    <div className="shift-header" />
                    
                    <div className="shift-details">
                      <div className="shift-info" title={`${new Date(shift.shift_date).toISOString()} ${shift.shift_time || ''}`.trim()}>
                        <FaCalendarAlt className="shift-icon" />
                        <span>{formatDateTime(shift.shift_date, shift.shift_time)}</span>
                      </div>
                      
                      <p className="shift-description">{shift.description}</p>
                      
                      <div className="shift-meta">
                        <span className="shift-created">
                          Criado por: {shift.creator_name}
                        </span>
                        <span className="shift-created">
                          Criado em: {new Date(shift.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {shift.viewers && shift.viewers.length > 0 && (
                          <span className="shift-viewers" title={shift.viewers.map(v => `${v.name} • ${new Date(v.at).toISOString()}`).join('\n')}>
                            Visto por: {shift.viewers.slice(0, 3).map(v => v.name).join(', ')}{shift.viewers.length > 3 ? ` +${shift.viewers.length - 3}` : ''}
                          </span>
                        )}
                        <span className="shift-updated">
                          Arquivado em: {new Date(shift.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shift-actions">
                      <button 
                        className="action-btn history"
                        onClick={() => setModalState({ type: 'history', shift: shift })}
                        title="Ver histórico"
                      >
                        <FaHistory />
                      </button>

                      {shift.viewers && shift.viewers.length > 0 && (
                        <div className="viewers-avatars" style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                          {shift.viewers.slice(0, 5).map((v, idx) => (
                            v.avatarUrl ? (
                              <img key={idx} src={v.avatarUrl} title={`${v.name} • ${new Date(v.at).toISOString()}`} alt={v.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                            ) : (
                              <div key={idx} className="avatar-dot" title={`${v.name} • ${new Date(v.at).toISOString()}`}></div>
                            )
                          ))}
                        </div>
                      )}
                      
                      <button 
                        className="action-btn unarchive"
                        onClick={() => handleUnarchiveShift(shift.id)}
                        title="Desarquivar"
                      >
                        <FaEye />
                      </button>
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
    </div>
  );
}

export default TrocaDeTurno;