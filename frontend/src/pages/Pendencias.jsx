import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaUserCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Pendencias.css';
import './Usuarios.css'; // Reutilizando estilos

// --- Componente do Modal para Adicionar/Editar Pendência ---
const TaskModal = ({ onClose, onSave, existingTask, profiles }) => {
  const [task, setTask] = useState(
    existingTask || {
      title: '', description: '', due_date: null, assignee_id: null
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingTask ? 'Editar' : 'Nova'} Pendência</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Título</label><input name="title" type="text" value={task.title} onChange={handleChange} required /></div>
          <div className="form-group"><label>Descrição (Opcional)</label><textarea name="description" className="form-group" rows="4" value={task.description || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Prazo Final (Opcional)</label><input name="due_date" type="date" value={task.due_date || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Atribuir a (Opcional)</label><select name="assignee_id" value={task.assignee_id || ''} onChange={handleChange}><option value="">Ninguém</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Pendência'}</button>
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
                const { data, error } = await supabase.from('task_history').select('*, profiles(full_name)').eq('task_id', task.id).order('created_at', { ascending: false });
                if (error) throw error;
                setHistory(data);
            } catch (error) {
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
        supabase.from('tasks').select('*, profiles(id, full_name, avatar_url)'),
        supabase.from('profiles').select('id, full_name')
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (profilesRes.error) throw profilesRes.error;
      setTasks(tasksRes.data);
      setProfiles(profilesRes.data);
    } catch (error) {
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
        const { error: updateError } = await supabase.from('tasks').update(taskData).eq('id', taskData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('tasks').insert({ ...taskData, creator_id: user.id });
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
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const toastId = toast.loading('Movendo pendência...');
    try {
        const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
        if (error) throw error;
        toast.success('Status atualizado!', { id: toastId });
        fetchTasksAndProfiles();
    } catch (error) {
        toast.error("Erro ao mover a pendência.", { id: toastId });
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

  return (
    <div>
      <div className="tasks-page-header">
        <h1>Pendências</h1>
        <button className="form-button" onClick={() => setModalState({ type: 'add', task: null })}>
          <FaPlus style={{ marginRight: '8px' }} />
          Nova Pendência
        </button>
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className="kanban-board">
          {columns.map(columnName => (
            <div key={columnName} className="kanban-column">
              <div className="kanban-column-header">
                <h2>{columnName}</h2>
                <span className="task-count">{(tasksByStatus[columnName] || []).length}</span>
              </div>
              <div className="kanban-tasks">
                {(tasksByStatus[columnName] || []).map((task, index) => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    onClick={() => setModalState({ type: 'edit', task: task })}
                  >
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-card-footer">
                      <div className="task-assignee">
                        {task.profiles ? (
                          <>
                            <img src={task.profiles.avatar_url} alt="avatar" className="task-avatar" />
                            <span>{task.profiles.full_name}</span>
                          </>
                        ) : (
                          <FaUserCircle className="task-avatar-placeholder" />
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'history', task: task }); }}>Histórico</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState.type === 'add' && <TaskModal onClose={() => setModalState({ type: null, task: null })} onSave={handleSaveTask} profiles={profiles} />}
      {modalState.type === 'edit' && <TaskModal onClose={() => setModalState({ type: null, task: null })} onSave={handleSaveTask} existingTask={modalState.task} profiles={profiles} />}
      {modalState.type === 'history' && <HistoryModal task={modalState.task} onClose={() => setModalState({ type: null, task: null })} />}
    </div>
  );
}

export default Pendencias;