import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaPlus } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './GestaoDeFerias.css';

// --- Componente do Menu de Ações com Portal ---
const ActionsMenu = ({ request, position, onClose, onEdit, onDelete }) => {
  const menuRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={menuRef} className="actions-menu" style={{ top: position.top, left: position.left }}>
      <button onClick={() => onEdit(request)}>Editar</button>
      <button onClick={() => onDelete(request.id)} className="delete-button-text">Excluir</button>
    </div>,
    document.body
  );
};

// --- Componente do Modal para Pedir/Editar Férias ---
const RequestVacationModal = ({ onClose, onSave, existingRequest }) => {
  const [startDate, setStartDate] = useState(existingRequest?.start_date || '');
  const [endDate, setEndDate] = useState(existingRequest?.end_date || '');
  const [vacationDays, setVacationDays] = useState('');
  const [comments, setComments] = useState(existingRequest?.comments || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingRequest) {
      const start = new Date(existingRequest.start_date);
      const end = new Date(existingRequest.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setVacationDays(diffDays);
    }
  }, [existingRequest]);

  const calculateEndDate = (start, days) => {
    if (!start || !days || days < 1) {
      setEndDate('');
      return false;
    }
    const startDateObj = new Date(start + 'T00:00:00');
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (parseInt(days, 10) - 1));
    const finalMonth = endDateObj.getUTCMonth() + 1;

    if ([10, 11, 12].includes(finalMonth)) {
      toast.error('O período de férias não pode terminar em Outubro, Novembro ou Dezembro.');
      setEndDate('');
      return false;
    }
    const formattedEndDate = endDateObj.toISOString().split('T')[0];
    setEndDate(formattedEndDate);
    return true;
  };

  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    const month = date.getUTCMonth() + 1;
    if ([10, 11, 12].includes(month)) {
      toast.error('Não é permitido solicitar férias em Outubro, Novembro ou Dezembro.');
      return;
    }
    setStartDate(e.target.value);
    calculateEndDate(e.target.value, vacationDays);
  };

  const handleVacationDaysChange = (e) => {
    setVacationDays(e.target.value);
    calculateEndDate(startDate, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !vacationDays) {
      toast.error("Preencha a data de início e o número de dias corretamente.");
      return;
    }
    setLoading(true);
    const success = await onSave({ startDate, endDate, comments });
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingRequest ? 'Editar' : 'Solicitar'} Férias</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="startDate">Data de Início</label>
            <input id="startDate" type="date" value={startDate} onChange={handleStartDateChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="vacationDays">Número de Dias</label>
            <input id="vacationDays" type="number" min="1" value={vacationDays} onChange={handleVacationDaysChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Data de Fim (calculada)</label>
            <input id="endDate" type="date" value={endDate} readOnly disabled style={{ background: 'var(--bg-color)', color: 'var(--secondary-text-color)' }} />
          </div>
          <div className="form-group">
            <label htmlFor="comments">Comentários (opcional)</label>
            <textarea id="comments" rows="3" value={comments} onChange={e => setComments(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading || !endDate}>
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---
function GestaoDeFerias() {
  const { user, profile } = useAuth();
  const [ferias, setFerias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('pendente');
  const [editingRequest, setEditingRequest] = useState(null);
  const [menuState, setMenuState] = useState({ request: null, position: null });

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const fetchFerias = async () => {
    try {
      setLoading(true);
      let query = supabase.from('ferias').select(`*, profiles ( full_name, avatar_url )`);
      if (activeFilter !== 'todos') query = query.eq('status', activeFilter);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      setFerias(data);
    } catch (error) {
      toast.error('Erro ao carregar os pedidos de férias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFerias();
  }, [activeFilter]);

  const handleRequest = async (requestData) => {
    const isEditing = !!editingRequest;
    const toastId = toast.loading(isEditing ? 'Atualizando solicitação...' : 'Enviando solicitação...');
    
    try {
      let error;
      if (isEditing) {
        const { error: updateError } = await supabase.from('ferias').update({
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          comments: requestData.comments,
        }).eq('id', editingRequest.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('ferias').insert({
          user_id: user.id,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          comments: requestData.comments,
        });
        error = insertError;
      }

      if (error) {
        if (error.message.includes('block_end_of_year_vacations')) throw new Error('Período de férias inválido (Out-Dez).');
        if (error.message.includes('violates exclusion constraint')) throw new Error('Este período já foi solicitado.');
        throw error;
      }
      toast.success(isEditing ? 'Solicitação atualizada!' : 'Solicitação enviada!', { id: toastId });
      if (!isEditing) setActiveFilter('pendente');
      fetchFerias();
      return true;
    } catch (error) {
      toast.error('Erro: ' + error.message, { id: toastId });
      return false;
    }
  };

  const handleDeleteRequest = async (feriasId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta solicitação?')) return;
    const toastId = toast.loading('Excluindo solicitação...');
    try {
      const { error } = await supabase.from('ferias').delete().eq('id', feriasId);
      if (error) throw error;
      toast.success('Solicitação excluída!', { id: toastId });
      fetchFerias();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message, { id: toastId });
    }
  };

  const handleUpdateStatus = async (feriasId, newStatus) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      const { error } = await supabase.from('ferias').update({ status: newStatus }).eq('id', feriasId);
      if (error) throw error;
      toast.success(`Pedido ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'}!`, { id: toastId });
      fetchFerias();
    } catch (error) {
      toast.error('Erro ao atualizar status: ' + error.message, { id: toastId });
    }
  };
  
  const handleMenuClick = (request, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const leftPosition = rect.right - 150;
    setMenuState({
      request,
      position: { top: rect.bottom + window.scrollY, left: leftPosition + window.scrollX },
    });
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="ferias-page">
      <div className="ferias-header">
        <h1>Gestão de Férias</h1>
        <button className="form-button" onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}>
          <FaPlus style={{ marginRight: '8px' }} />
          Pedir Férias
        </button>
      </div>
      
      <div className="filter-buttons">
        <button onClick={() => setActiveFilter('pendente')} className={activeFilter === 'pendente' ? 'active' : ''}>Pendentes</button>
        <button onClick={() => setActiveFilter('aprovado')} className={activeFilter === 'aprovado' ? 'active' : ''}>Aprovados</button>
        <button onClick={() => setActiveFilter('rejeitado')} className={activeFilter === 'rejeitado' ? 'active' : ''}>Rejeitados</button>
        <button onClick={() => setActiveFilter('todos')} className={activeFilter === 'todos' ? 'active' : ''}>Todos</button>
      </div>

      <div className="ferias-list">
        {!loading && ferias.length === 0 && <p>Nenhum pedido de férias encontrado para este filtro.</p>}
        {!loading && ferias.map(feria => {
          const isOwner = feria.user_id === user.id;
          const isCoordinator = profile?.role === 'coordenador';
          const canManage = (isOwner && feria.status === 'pendente') || isCoordinator;

          return (
            <div key={feria.id} className="ferias-card">
              <div className="ferias-card-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                  {isCoordinator && (
                    <div className="ferias-user-info">
                      {feria.profiles.avatar_url ? (
                        <img src={feria.profiles.avatar_url} alt="Avatar" className="ferias-avatar" />
                      ) : (
                        <FaUserCircle className="ferias-avatar-placeholder" />
                      )}
                      <span>{feria.profiles.full_name || 'Usuário'}</span>
                    </div>
                  )}
                  <span className={`status-badge status-${feria.status}`}>{feria.status}</span>
                </div>
                
                {canManage && (
                  <button className="card-actions-button" onClick={(e) => handleMenuClick(feria, e)}>
                    <HiDotsVertical size={20} />
                  </button>
                )}
              </div>
              <div className="ferias-card-body">
                <div><strong>Início:</strong><span>{formatDate(feria.start_date)}</span></div>
                <div><strong>Fim:</strong><span>{formatDate(feria.end_date)}</span></div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Comentários:</strong><span>{feria.comments || 'Nenhum.'}</span></div>
              </div>
              {isCoordinator && feria.status === 'pendente' && (
                <div className="ferias-card-footer">
                  <button className="action-button reject-button" onClick={() => handleUpdateStatus(feria.id, 'rejeitado')}>Rejeitar</button>
                  <button className="action-button approve-button" onClick={() => handleUpdateStatus(feria.id, 'aprovado')}>Aprovar</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {menuState.request && (
        <ActionsMenu
          request={menuState.request}
          position={menuState.position}
          onClose={() => setMenuState({ request: null, position: null })}
          onEdit={(requestToEdit) => {
            setEditingRequest(requestToEdit);
            setMenuState({ request: null, position: null });
          }}
          onDelete={(requestId) => {
            handleDeleteRequest(requestId);
            setMenuState({ request: null, position: null });
          }}
        />
      )}

      {(isModalOpen || editingRequest) && (
        <RequestVacationModal
          onClose={() => { setIsModalOpen(false); setEditingRequest(null); }}
          onSave={handleRequest}
          existingRequest={editingRequest}
        />
      )}
    </div>
  );
}

export default GestaoDeFerias;