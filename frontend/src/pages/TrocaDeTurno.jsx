import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaArchive, FaHistory, FaClock, FaUser, FaCalendarAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './TrocaDeTurno.css';

// --- Modal para Adicionar/Editar Troca de Turno ---
const ShiftChangeModal = ({ onClose, onSave, existingShift, profiles }) => {
  const [shift, setShift] = useState(
    existingShift || {
      title: '',
      description: '',
      shift_date: new Date().toISOString().split('T')[0],
      shift_time: '',
      requester_id: null,
      assignee_id: null,
      status: 'Pendente'
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
            <label>Título *</label>
            <input 
              name="title" 
              type="text" 
              value={shift.title} 
              onChange={handleChange} 
              required 
              placeholder="Ex: Troca de turno noturno"
            />
          </div>
          
          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              name="description" 
              rows="4" 
              value={shift.description || ''} 
              onChange={handleChange}
              placeholder="Detalhes da troca de turno..."
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
          
          <div className="form-row">
            <div className="form-group">
              <label>Solicitante</label>
              <select 
                name="requester_id" 
                value={shift.requester_id || ''} 
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Responsável</label>
              <select 
                name="assignee_id" 
                value={shift.assignee_id || ''} 
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select 
              name="status" 
              value={shift.status} 
              onChange={handleChange}
            >
              <option value="Pendente">Pendente</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Rejeitado">Rejeitado</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

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
const HistoryModal = ({ shift, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shift_change_history')
          .select('*, profiles(full_name)')
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
        <h2>Histórico: {shift.title}</h2>
        <div className="history-list">
          {loading && <p>Carregando...</p>}
          {!loading && history.length === 0 && <p>Nenhum histórico encontrado.</p>}
          {!loading && history.map(item => (
            <div key={item.id} className="history-item">
              <p className="history-item-description">{item.event_description}</p>
              <p className="history-item-meta">
                {new Date(item.created_at).toLocaleString('pt-BR')} - {item.profiles?.full_name || 'Sistema'}
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
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, shift: null });

  const fetchShiftsAndProfiles = async () => {
    try {
      setLoading(true);
      const [shiftsRes, profilesRes] = await Promise.all([
        supabase
          .from('shift_changes')
          .select(`
            *,
            requester:profiles!shift_changes_requester_id_fkey(id, full_name),
            assignee:profiles!shift_changes_assignee_id_fkey(id, full_name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name')
      ]);
      
      if (shiftsRes.error) throw shiftsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      setShifts(shiftsRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar trocas de turno:', error);
      toast.error('Erro ao carregar trocas de turno');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsAndProfiles();
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
      fetchShiftsAndProfiles();
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
        fetchShiftsAndProfiles();
      } catch (error) {
        toast.error('Erro ao arquivar: ' + error.message, { id: toastId });
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendente': return 'status-pendente';
      case 'Aprovado': return 'status-aprovado';
      case 'Rejeitado': return 'status-rejeitado';
      case 'Concluído': return 'status-concluido';
      case 'Arquivado': return 'status-arquivado';
      default: return '';
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return '---';
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('pt-BR');
    return time ? `${formattedDate} às ${time}` : formattedDate;
  };

  if (loading) return <div className="loading-state">Carregando trocas de turno...</div>;

  return (
    <div className="shift-changes-container">
      <div className="shift-changes-header">
        <h1>🔄 Troca de Turno</h1>
        <button className="form-button" onClick={() => setModalState({ type: 'add', shift: null })}>
          <FaPlus style={{ marginRight: '8px' }} />
          Nova Troca
        </button>
      </div>

      <div className="shift-changes-content">
        {shifts.length > 0 ? (
          <div className="shifts-grid">
            {shifts.map(shift => (
              <div key={shift.id} className="shift-card">
                <div className="shift-header">
                  <h3 className="shift-title">{shift.title}</h3>
                  <span className={`shift-status ${getStatusClass(shift.status)}`}>
                    {shift.status}
                  </span>
                </div>
                
                <div className="shift-details">
                  <div className="shift-info">
                    <FaCalendarAlt className="shift-icon" />
                    <span>{formatDateTime(shift.shift_date, shift.shift_time)}</span>
                  </div>
                  
                  {shift.description && (
                    <p className="shift-description">{shift.description}</p>
                  )}
                  
                  <div className="shift-participants">
                    {shift.requester && (
                      <div className="participant">
                        <FaUser className="participant-icon" />
                        <span><strong>Solicitante:</strong> {shift.requester.full_name}</span>
                      </div>
                    )}
                    
                    {shift.assignee && (
                      <div className="participant">
                        <FaUser className="participant-icon" />
                        <span><strong>Responsável:</strong> {shift.assignee.full_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="shift-meta">
                    <span className="shift-created">
                      Criado em: {new Date(shift.created_at).toLocaleDateString('pt-BR')}
                    </span>
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
                  
                  {shift.status !== 'Arquivado' && (
                    <button 
                      className="action-btn archive"
                      onClick={() => handleArchiveShift(shift.id)}
                      title="Arquivar"
                    >
                      <FaArchive />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaClock />
            </div>
            <h3>Nenhuma troca de turno encontrada</h3>
            <p>Crie uma nova troca de turno para começar.</p>
          </div>
        )}
      </div>

      {modalState.type === 'add' && (
        <ShiftChangeModal 
          onClose={() => setModalState({ type: null, shift: null })} 
          onSave={handleSaveShift} 
          profiles={profiles} 
        />
      )}
      
      {modalState.type === 'edit' && (
        <ShiftChangeModal 
          onClose={() => setModalState({ type: null, shift: null })} 
          onSave={handleSaveShift} 
          existingShift={modalState.shift} 
          profiles={profiles} 
        />
      )}
      
      {modalState.type === 'history' && (
        <HistoryModal 
          shift={modalState.shift} 
          onClose={() => setModalState({ type: null, shift: null })} 
        />
      )}
    </div>
  );
}

export default TrocaDeTurno;