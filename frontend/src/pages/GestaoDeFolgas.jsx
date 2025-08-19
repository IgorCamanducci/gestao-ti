import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaPlus } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './GestaoDeFolgas.css';

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

// --- Componente do Modal para Pedir/Editar Folga ---
const RequestLeaveModal = ({ onClose, onSave, existingRequest }) => {
  const [startDate, setStartDate] = useState(existingRequest?.start_date || '');
  const [endDate, setEndDate] = useState(existingRequest?.end_date || '');
  const [reason, setReason] = useState(existingRequest?.reason || '');
  const [workedHoliday, setWorkedHoliday] = useState(existingRequest?.worked_holiday_date || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave({ startDate, endDate, reason, workedHoliday });
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingRequest ? 'Editar' : 'Solicitar'} Folga</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="startDate">Data de Início</label>
            <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Data de Fim</label>
            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="workedHoliday">Feriado Trabalhado (Opcional)</label>
            <input id="workedHoliday" type="date" value={workedHoliday} onChange={e => setWorkedHoliday(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="reason">Motivo (opcional)</label>
            <textarea id="reason" rows="3" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente Principal da Página ---
function GestaoDeFolgas() {
  const { user, profile } = useAuth();
  const [folgas, setFolgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('pendente');
  const [editingRequest, setEditingRequest] = useState(null);
  const [menuState, setMenuState] = useState({ request: null, position: null });

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const fetchFolgas = async () => {
    try {
      setLoading(true);
      let query = supabase.from('folgas').select(`*, profiles ( full_name, avatar_url )`);
      if (activeFilter !== 'todos') query = query.eq('status', activeFilter);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      setFolgas(data);
    } catch (error) {
      toast.error('Erro ao carregar os pedidos de folga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolgas();
  }, [activeFilter]);

  const handleRequest = async (requestData) => {
    const isEditing = !!editingRequest;
    const toastId = toast.loading(isEditing ? 'Atualizando solicitação...' : 'Enviando solicitação...');
    
    try {
      let error;
      if (isEditing) {
        const { error: updateError } = await supabase.from('folgas').update({
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          reason: requestData.reason,
          worked_holiday_date: requestData.workedHoliday || null,
        }).eq('id', editingRequest.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('folgas').insert({
          user_id: user.id,
          start_date: requestData.startDate,
          end_date: requestData.endDate,
          reason: requestData.reason,
          worked_holiday_date: requestData.workedHoliday || null,
        });
        error = insertError;
      }
      if (error) throw error;
      toast.success(isEditing ? 'Solicitação atualizada!' : 'Solicitação enviada!', { id: toastId });
      if (!isEditing) setActiveFilter('pendente'); // Volta para pendentes ao criar
      fetchFolgas();
      return true;
    } catch (error) {
      toast.error('Erro: ' + error.message, { id: toastId });
      return false;
    }
  };

  const handleDeleteRequest = async (folgaId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta solicitação?')) return;
    const toastId = toast.loading('Excluindo solicitação...');
    try {
      const { error } = await supabase.from('folgas').delete().eq('id', folgaId);
      if (error) throw error;
      toast.success('Solicitação excluída!', { id: toastId });
      fetchFolgas();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message, { id: toastId });
    }
  };

  const handleUpdateStatus = async (folgaId, newStatus) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      const { error } = await supabase.from('folgas').update({ status: newStatus }).eq('id', folgaId);
      if (error) throw error;
      toast.success(`Pedido ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'}!`, { id: toastId });
      fetchFolgas();
    } catch (error) {
      toast.error('Erro ao atualizar status: ' + error.message, { id: toastId });
    }
  };

  const handleMenuClick = (request, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const leftPosition = rect.right - 150; // 150 é a largura do menu
    setMenuState({
      request,
      position: { top: rect.bottom + window.scrollY, left: leftPosition + window.scrollX },
    });
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>📅 Gestão de Folgas</h1>
        <div className="search-and-actions">
          <button className="form-button" onClick={() => setIsModalOpen(true)}>
            <FaPlus style={{ marginRight: '8px' }} />
            Solicitar Folga
          </button>
        </div>
      </div>

      <div className="asset-tabs">
        <button 
          className={activeFilter === 'pendente' ? 'active' : ''} 
          onClick={() => setActiveFilter('pendente')}
        >
          Pendentes
        </button>
        <button 
          className={activeFilter === 'aprovado' ? 'active' : ''} 
          onClick={() => setActiveFilter('aprovado')}
        >
          Aprovadas
        </button>
        <button 
          className={activeFilter === 'rejeitado' ? 'active' : ''} 
          onClick={() => setActiveFilter('rejeitado')}
        >
          Rejeitadas
        </button>
        <button 
          className={activeFilter === 'todos' ? 'active' : ''} 
          onClick={() => setActiveFilter('todos')}
        >
          Todos
        </button>
      </div>

      <div className="asset-table-container">
        {!loading && folgas.length === 0 ? (
          <div className="empty-state">
            <span>Nenhum pedido de folga encontrado para este filtro.</span>
          </div>
        ) : (
          <table className="asset-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Período</th>
                <th>Feriado Trabalhado</th>
                <th>Motivo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && folgas.map(folga => {
                const isOwner = folga.user_id === user.id;
                const isCoordinator = profile?.role === 'coordenador';
                const canManage = (isOwner && folga.status === 'pendente') || isCoordinator;

                return (
                  <tr 
                    key={folga.id} 
                    className="folga-row"
                    onClick={() => {
                      if (canManage) {
                        setEditingRequest(folga);
                        setIsModalOpen(true);
                      }
                    }}
                    style={{ cursor: canManage ? 'pointer' : 'default' }}
                    title={canManage ? 'Clique para editar' : ''}
                  >
                    <td className="asset-name">
                      <div className="asset-info">
                        {isCoordinator && (
                          <>
                            {folga.profiles.avatar_url ? (
                              <img src={folga.profiles.avatar_url} alt="Avatar" className="folga-avatar" />
                            ) : (
                              <FaUserCircle className="folga-avatar-placeholder" />
                            )}
                            <span>{folga.profiles.full_name || 'Usuário'}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div><strong>Início:</strong> {formatDate(folga.start_date)}</div>
                      <div><strong>Fim:</strong> {formatDate(folga.start_date)}</div>
                    </td>
                    <td>{folga.worked_holiday_date ? formatDate(folga.worked_holiday_date) : '-'}</td>
                    <td>{folga.reason || 'Nenhum.'}</td>
                    <td>
                      <span className={`status-badge status-${folga.status}`}>{folga.status}</span>
                    </td>
                    <td className="actions-cell">
                      {canManage && (
                        <button 
                          className="actions-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(folga, e);
                          }}
                          title="Ações"
                        >
                          <HiDotsVertical />
                        </button>
                      )}
                      {isCoordinator && folga.status === 'pendente' && (
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                          <button 
                            className="form-button" 
                            style={{ 
                              background: 'var(--error-color)', 
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              fontSize: 'var(--font-size-xs)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(folga.id, 'rejeitado');
                            }}
                          >
                            Rejeitar
                          </button>
                          <button className="form-button" 
                            style={{ 
                              background: 'var(--success-color)', 
                              padding: 'var(--spacing-sm)',
                              fontSize: 'var(--font-size-xs)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(folga.id, 'aprovado');
                            }}
                          >
                            Aprovar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
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
        <RequestLeaveModal
          onClose={() => { setIsModalOpen(false); setEditingRequest(null); }}
          onSave={handleRequest}
          existingRequest={editingRequest}
        />
      )}
    </div>
  );
}

export default GestaoDeFolgas;