import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaUserCircle, FaExclamationTriangle, FaCheckCircle, FaClock, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Pendencias.css';
import './Usuarios.css';

// --- Componente do Modal para Adicionar/Editar Pendência ---
const TaskModal = ({ onClose, onSave, existingTask, profiles }) => {
  const [task, setTask] = useState(
    existingTask || {
      title: '',
      description: '',
      due_date: null,
      assignee_id: null,
      priority: 'Média',
      status: 'Aberta'
    }
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(task, !!existingTask);
    setLoading(false);
    if (success) onClose();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Baixa': return '#28a745';
      case 'Média': return '#ffc107';
      case 'Alta': return '#fd7e14';
      case 'Crítica': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingTask ? 'Editar' : 'Nova'} Pendência</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título *</label>
            <input 
              name="title" 
              type="text" 
              value={task.title} 
              onChange={handleChange} 
              required 
              placeholder="Digite o título da pendência"
            />
          </div>
          
          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              name="description" 
              rows="4" 
              value={task.description || ''} 
              onChange={handleChange}
              placeholder="Descreva os detalhes da pendência..."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Prazo Final</label>
              <input 
                name="due_date" 
                type="date" 
                value={task.due_date || ''} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="form-group">
              <label>Criticidade *</label>
              <select 
                name="priority" 
                value={task.priority} 
                onChange={handleChange}
                required
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Atribuir a</label>
            <select 
              name="assignee_id" 
              value={task.assignee_id || ''} 
              onChange={handleChange}
            >
              <option value="">Ninguém</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          
          {existingTask && (
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status" 
                value={task.status} 
                onChange={handleChange}
              >
                <option value="Aberta">Aberta</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>
              Cancelar
            </button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Salvando...' : (existingTask ? 'Atualizar' : 'Criar Pendência')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente do Modal para Ver Histórico da Tarefa ---
const HistoryModal = ({ task, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Buscar histórico da tabela de histórico de tarefas
        const { data, error } = await supabase
          .from('task_history')
          .select('*, profiles(full_name)')
          .eq('task_id', task.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.warn('Erro ao buscar histórico, criando histórico básico:', error);
          // Se não existir tabela de histórico, criar histórico básico
          const basicHistory = [
            {
              id: 1,
              event_description: `Pendência criada: ${task.title}`,
              created_at: task.created_at,
              profiles: { full_name: 'Sistema' }
            }
          ];
          if (task.assignee_id) {
            basicHistory.push({
              id: 2,
              event_description: `Pendência atribuída`,
              created_at: task.updated_at,
              profiles: { full_name: 'Sistema' }
            });
          }
          setHistory(basicHistory);
        } else {
          setHistory(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        toast.error("Erro ao carregar histórico da pendência.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [task]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '600px'}} onClick={e => e.stopPropagation()}>
        <h2>Histórico: {task.title}</h2>
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
function Pendencias() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, task: null });

  const fetchTasksAndProfiles = async () => {
    try {
      setLoading(true);
      const [tasksRes, profilesRes] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name')
      ]);
      
      if (tasksRes.error) throw tasksRes.error;
      if (profilesRes.error) throw profilesRes.error;
      
      setTasks(tasksRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
      toast.error("Erro ao carregar pendências.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProfiles();
  }, []);

  const handleSaveTask = async (taskData, isEditing) => {
    const toastId = toast.loading(isEditing ? 'Atualizando...' : 'Criando pendência...');
    try {
      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', taskData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert({ ...taskData, creator_id: user.id });
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success(`Pendência ${isEditing ? 'atualizada' : 'criada'}!`, { id: toastId });
      fetchTasksAndProfiles();
      return true;
    } catch (error) {
      toast.error("Erro: " + error.message, { id: toastId });
      return false;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Crítica': return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      case 'Alta': return <FaExclamationTriangle style={{ color: '#fd7e14' }} />;
      case 'Média': return <FaClock style={{ color: '#ffc107' }} />;
      case 'Baixa': return <FaCheckCircle style={{ color: '#28a745' }} />;
      default: return <FaClock />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Crítica': return 'priority-critical';
      case 'Alta': return 'priority-high';
      case 'Média': return 'priority-medium';
      case 'Baixa': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberta': return 'status-open';
      case 'Em Andamento': return 'status-in-progress';
      case 'Concluída': return 'status-completed';
      case 'Cancelada': return 'status-cancelled';
      default: return '';
    }
  };

  const tasksByStatus = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const status = task.status || 'Aberta';
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const columns = ['Aberta', 'Em Andamento', 'Concluída'];

  if (loading) return <div className="loading-state">Carregando pendências...</div>;

  return (
    <div className="pendencias-container">
      <div className="pendencias-header">
        <h1>📋 Pendências</h1>
        <button className="form-button" onClick={() => setModalState({ type: 'add', task: null })}>
          <FaPlus style={{ marginRight: '8px' }} />
          Nova Pendência
        </button>
      </div>

      <div className="kanban-board">
        {columns.map(columnName => (
          <div key={columnName} className="kanban-column">
            <div className="kanban-column-header">
              <h2>{columnName}</h2>
              <span className="task-count">{(tasksByStatus[columnName] || []).length}</span>
            </div>
            <div className="kanban-tasks">
              {(tasksByStatus[columnName] || []).map((task) => (
                <div 
                  key={task.id} 
                  className={`task-card ${getPriorityClass(task.priority)}`}
                  onClick={() => setModalState({ type: 'edit', task: task })}
                >
                  <div className="task-header">
                    <div className="task-priority">
                      {getPriorityIcon(task.priority)}
                      <span className="priority-label">{task.priority}</span>
                    </div>
                    <span className={`task-status ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  {task.due_date && (
                    <div className="task-due-date">
                      <FaClock className="due-icon" />
                      <span>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  
                  <div className="task-footer">
                    <div className="task-assignee">
                      {task.assignee ? (
                        <>
                          {task.assignee.avatar_url ? (
                            <img src={task.assignee.avatar_url} alt="avatar" className="task-avatar" />
                          ) : (
                            <FaUserCircle className="task-avatar-placeholder" />
                          )}
                          <span>{task.assignee.full_name}</span>
                        </>
                      ) : (
                        <div className="no-assignee">
                          <FaUser className="no-assignee-icon" />
                          <span>Sem atribuição</span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="history-btn"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setModalState({ type: 'history', task: task }); 
                      }}
                      title="Ver histórico"
                    >
                      <FaClock />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalState.type === 'add' && (
        <TaskModal 
          onClose={() => setModalState({ type: null, task: null })} 
          onSave={handleSaveTask} 
          profiles={profiles} 
        />
      )}
      
      {modalState.type === 'edit' && (
        <TaskModal 
          onClose={() => setModalState({ type: null, task: null })} 
          onSave={handleSaveTask} 
          existingTask={modalState.task} 
          profiles={profiles} 
        />
      )}
      
      {modalState.type === 'history' && (
        <HistoryModal 
          task={modalState.task} 
          onClose={() => setModalState({ type: null, task: null })} 
        />
      )}
    </div>
  );
}

export default Pendencias;