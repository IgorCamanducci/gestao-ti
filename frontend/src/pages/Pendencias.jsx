import React, { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaUserCircle, FaExclamationTriangle, FaCheckCircle, FaClock, FaUser, FaComment, FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
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
              <option value="">Selecione...</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
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
               <option value="Arquivada">Arquivada</option>
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

// --- Modal para Ver Histórico ---
const HistoryModal = ({ task, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('task_history')
          .select('*, profiles(full_name)')
          .eq('task_id', task.id)
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
  }, [task.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <h2>Histórico da Pendência</h2>
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

// --- Modal para Comentários ---
const CommentsModal = ({ task, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingComment, setEditingComment] = useState(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, task_id, comment, comment_text, created_by, created_at')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = data || [];
      const userIds = Array.from(new Set(rows.map(r => r.created_by).filter(Boolean)));
      let userMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        (profilesData || []).forEach(p => { userMap[p.id] = p.full_name; });
      }
      const mapped = rows.map(c => ({
        ...c,
        author_name: userMap[c.created_by] || 'Usuário',
        display_comment: c.comment ?? c.comment_text ?? ''
      }));
      setComments(mapped);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: task.id,
          comment: newComment.trim(),
          comment_text: newComment.trim(),
          created_by: user.id
        });

      if (error) throw error;
      
      setNewComment('');
      toast.success('Comentário adicionado!');
      fetchComments();
    } catch (error) {
      toast.error('Erro ao adicionar comentário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({ comment: newText, comment_text: newText })
        .eq('id', commentId)
        .eq('created_by', user.id);

      if (error) throw error;
      
      setEditingComment(null);
      toast.success('Comentário atualizado!');
      fetchComments();
    } catch (error) {
      toast.error('Erro ao atualizar comentário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)
        .eq('created_by', user.id);

      if (error) throw error;
      
      toast.success('Comentário excluído!');
      fetchComments();
    } catch (error) {
      toast.error('Erro ao excluir comentário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <h2>Comentários da Pendência</h2>
        
        <form onSubmit={handleAddComment} style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label>Novo Comentário</label>
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Digite seu comentário..."
              rows="3"
              required
            />
          </div>
          <button type="submit" className="form-button" disabled={saving || !newComment.trim()}>
            {saving ? 'Adicionando...' : 'Adicionar Comentário'}
          </button>
        </form>

        <div className="comments-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && <p>Carregando comentários...</p>}
          {!loading && comments.length === 0 && <p>Nenhum comentário ainda.</p>}
          {!loading && comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author_name || 'Usuário'}</span>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleString('pt-BR')}
                </span>
                {comment.created_by === user.id && (
                  <div className="comment-actions">
                    {editingComment === comment.id ? (
                      <>
                        <button 
                          onClick={() => {
                            const updatedComments = comments.map(c => 
                              c.id === comment.id ? { ...c, display_comment: c.display_comment } : c
                            );
                            const commentToUpdate = updatedComments.find(c => c.id === comment.id);
                            handleEditComment(comment.id, commentToUpdate.display_comment);
                          }}
                          className="action-btn edit"
                        >
                          <FaCheckCircle />
                        </button>
                        <button 
                          onClick={() => setEditingComment(null)}
                          className="action-btn"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setEditingComment(comment.id)}
                          className="action-btn edit"
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="action-btn delete"
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {editingComment === comment.id ? (
                <textarea 
                  defaultValue={comment.display_comment}
                  onChange={(e) => {
                    const updatedComments = comments.map(c => 
                      c.id === comment.id ? { ...c, display_comment: e.target.value } : c
                    );
                    setComments(updatedComments);
                  }}
                  rows="3"
                  style={{ width: '100%', marginTop: '10px' }}
                />
              ) : (
                <p className="comment-text">{comment.display_comment}</p>
              )}
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
  const [showArchived, setShowArchived] = useState(false);

  const fetchTasksAndProfiles = async () => {
    try {
      setLoading(true);
      
      // Buscar tarefas primeiro
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Erro na consulta tasks:', tasksError);
        throw tasksError;
      }

      const baseTasks = tasksData || [];
      
      if (baseTasks.length === 0) {
        setTasks([]);
        setProfiles([]);
        return;
      }

      // Buscar perfis e views em paralelo
      const [profilesRes, viewsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url'),
        supabase.from('task_views').select('task_id, viewed_by, created_at')
      ]);

      if (profilesRes.error) {
        console.error('Erro na consulta profiles:', profilesRes.error);
        throw profilesRes.error;
      }

      const viewsRows = viewsRes.data || [];

      // Contar comentários por tarefa
      const taskIds = baseTasks.map(t => t.id);
      let commentsCountMap = {};
      
      if (taskIds.length > 0) {
        try {
          const { data: commentsRows, error: commentsErr } = await supabase
            .from('task_comments')
            .select('task_id')
            .in('task_id', taskIds);
          
          if (!commentsErr && commentsRows) {
            commentsRows.forEach(r => {
              commentsCountMap[r.task_id] = (commentsCountMap[r.task_id] || 0) + 1;
            });
          }
        } catch (commentsError) {
          console.warn('Erro ao buscar comentários:', commentsError);
        }
      }

      // Mapear perfis
      const profileById = {};
      (profilesRes.data || []).forEach(p => { profileById[p.id] = p; });

      // Montar viewers por tarefa
      const viewsByTask = {};
      viewsRows.forEach(v => {
        const viewer = profileById[v.viewed_by];
        const entry = {
          userId: v.viewed_by,
          name: viewer?.full_name || v.viewed_by,
          avatarUrl: viewer?.avatar_url || null,
          at: v.created_at,
        };
        if (!viewsByTask[v.task_id]) {
          viewsByTask[v.task_id] = new Map([[v.viewed_by, entry]]);
        } else {
          const existing = viewsByTask[v.task_id].get(v.viewed_by);
          if (!existing || new Date(entry.at) > new Date(existing.at)) {
            viewsByTask[v.task_id].set(v.viewed_by, entry);
          }
        }
      });

      // Enriquecer tarefas com dados dos perfis
      const tasksWithCounts = baseTasks.map(t => {
        const assignee = profileById[t.assignee_id];
        const creator = profileById[t.creator_id];
        
        return { 
          ...t, 
          assignee: assignee ? { id: assignee.id, full_name: assignee.full_name, avatar_url: assignee.avatar_url } : null,
          creator: creator ? { id: creator.id, full_name: creator.full_name } : null,
          comments_count: commentsCountMap[t.id] || 0,
          viewers: viewsByTask[t.id] ? Array.from(viewsByTask[t.id].values()).sort((a,b)=> new Date(b.at)-new Date(a.at)) : []
        };
      });

      setTasks(tasksWithCounts);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar pendências:', error);
      toast.error("Erro ao carregar pendências.");
      setTasks([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProfiles();
  }, []);

  useEffect(() => {
    if (!loading && tasks && tasks.length > 0) {
      autoArchiveCompletedTasks(tasks);
    }
  }, [loading, tasks]);

  const handleSaveTask = async (taskData, isEditing) => {
    const toastId = toast.loading(isEditing ? 'Atualizando...' : 'Criando pendência...');
    try {
      let error;
      if (isEditing) {
        const { id, title, description, due_date, assignee_id, priority, status } = taskData;
        const payload = { title, description, due_date, assignee_id, priority, status };
        const { error: updateError } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id);
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
      case 'Arquivada': return 'status-archived';
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

  const columns = showArchived ? ['Aberta', 'Em Andamento', 'Concluída', 'Arquivada'] : ['Aberta', 'Em Andamento', 'Concluída'];

  const formatDateTimeShort = (isoString) => {
    if (!isoString) return '---';
    const d = new Date(isoString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} - ${hh}:${min}`;
  };

  const recordView = async (taskId) => {
    try {
      // Verificar se a tabela task_views existe primeiro
      const { data: checkTable, error: checkError } = await supabase
        .from('task_views')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.warn('Tabela task_views não existe ou erro:', checkError);
        return; // Não falha se a tabela não existir
      }

      // Tentar inserir ou atualizar a visualização
      const { error } = await supabase
        .from('task_views')
        .upsert(
          { 
            task_id: taskId, 
            viewed_by: user.id,
            created_at: new Date().toISOString()
          }, 
          { 
            onConflict: 'task_id,viewed_by',
            ignoreDuplicates: false
          }
        );
      
      if (error) {
        console.error('Erro ao registrar visualização:', error);
        // Não mostrar toast de erro para não incomodar o usuário
        return;
      }
      
      // Atualizar a lista de tarefas para refletir a nova visualização
      fetchTasksAndProfiles();
    } catch (e) {
      console.error('Erro ao registrar visualização:', e);
      // Não mostrar toast de erro para não incomodar o usuário
    }
  };

  const onTaskCardClick = async (task) => {
    // Registro no backend
    recordView(task.id);
    // Atualização otimista: adiciona o usuário atual na lista de visualizações
    setTasks(prev => prev.map(t => {
      if (t.id !== task.id) return t;
      const viewerProfile = profiles.find(p => p.id === user.id);
      const viewerEntry = {
        userId: user.id,
        name: viewerProfile?.full_name || 'Você',
        avatarUrl: viewerProfile?.avatar_url || null,
        at: new Date().toISOString(),
      };
      const existing = Array.isArray(t.viewers) ? t.viewers : [];
      const withoutDup = existing.filter(v => v.userId !== user.id);
      return { ...t, viewers: [viewerEntry, ...withoutDup] };
    }));
    setModalState({ type: 'edit', task: task });
  };

  const observerRef = useRef(null);
  const viewedSetRef = useRef(new Set());

  useEffect(() => {
    if (loading) return;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visibleEnough = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        if (!visibleEnough) return;
        const taskId = entry.target.getAttribute('data-task-id');
        if (!taskId) return;
        const alreadyInSession = viewedSetRef.current.has(taskId);
        const taskObj = tasks.find(t => String(t.id) === String(taskId));
        const alreadyViewed = (taskObj?.viewers || []).some(v => v.userId === user.id);
        if (!alreadyViewed && !alreadyInSession) {
          viewedSetRef.current.add(taskId);
          recordView(taskId);
        }
      });
    }, { threshold: [0.6] });

    tasks.forEach((t) => {
      const el = document.getElementById(`task-card-${t.id}`);
      if (el) {
        el.setAttribute('data-task-id', String(t.id));
        observerRef.current.observe(el);
      }
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [tasks, loading, user.id]);

  const getAutoArchiveInfo = (task) => {
    if (task.status !== 'Concluída') return null;
    const baseAt = new Date(task.updated_at || task.created_at).getTime();
    const eightHours = 8 * 60 * 60 * 1000;
    const archiveAt = baseAt + eightHours;
    const now = Date.now();
    const remainingMs = archiveAt - now;
    if (remainingMs <= 0) return { text: 'Arquivar: pronto', ready: true };
    const remainingMin = Math.ceil(remainingMs / (60 * 1000));
    const hours = Math.floor(remainingMin / 60);
    const minutes = remainingMin % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return { text: `Arquiva em ${hh}:${mm}`, ready: false };
  };

  const autoArchiveCompletedTasks = async (taskList) => {
    try {
      const eightHours = 8 * 60 * 60 * 1000;
      const now = Date.now();
      const dueIds = (taskList || [])
        .filter(t => t.status === 'Concluída')
        .filter(t => (new Date(t.updated_at || t.created_at).getTime() + eightHours) <= now)
        .map(t => t.id);
      if (dueIds.length === 0) return;
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'Arquivada' })
        .in('id', dueIds);
      if (!error) {
        toast.success(`${dueIds.length} pendência(s) arquivada(s) automaticamente.`);
        fetchTasksAndProfiles();
      }
    } catch (_) {}
  };

  if (loading) return <div className="loading-state">Carregando pendências...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>📋 Pendências</h1>
        <div className="search-and-actions">
          <button 
            className="form-button archive-toggle"
            onClick={() => setShowArchived(!showArchived)}
            style={{ background: showArchived ? 'var(--warning-color)' : 'var(--secondary-text-color)' }}
          >
            {showArchived ? <FaEyeSlash /> : <FaEye />}
            {showArchived ? 'Ocultar Arquivados' : 'Ver Arquivados'}
          </button>
          <button className="form-button" onClick={() => setModalState({ type: 'add', task: null })}>
            <FaPlus style={{ marginRight: '8px' }} />
            Nova Pendência
          </button>
        </div>
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
                  id={`task-card-${task.id}`}
                  className={`task-card ${getPriorityClass(task.priority)}`}
                  onClick={() => onTaskCardClick(task)}
                  style={{ cursor: 'pointer' }}
                  title="Clique para editar"
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

                  {/* Meta do topo removida para evitar duplicidade */}
                  
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
                    <div className="task-footer-left">
                      <div className="task-assignee">
                        {task.assignee ? (
                          <>
                            {task.assignee.avatar_url ? (
                              <img 
                                src={task.assignee.avatar_url} 
                                alt={task.assignee.full_name}
                                className="task-avatar"
                              />
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
                      {/* Metas discretas: criado em, visualizado por, e tempo para arquivar */}
                      <div className="task-meta-inline">
                        <span className="meta-line">Criação: {formatDateTimeShort(task.created_at)}</span>
                        <span className="meta-line">
                          Visualizado por: {task.viewers && task.viewers.length > 0 ? task.viewers.map(v => v.name.split(' ')[0]).join(', ') : '—'}
                        </span>
                        {getAutoArchiveInfo(task) && (
                          <span className={`meta-line ${getAutoArchiveInfo(task).ready ? 'meta-archive-ready' : 'meta-archive-soon'}`}>
                            Arquivar em: {getAutoArchiveInfo(task).ready ? 'pronto' : getAutoArchiveInfo(task).text.replace('Arquiva em ', '')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      className="history-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalState({ type: 'comments', task: task });
                      }}
                      title={task.comments_count > 0 ? `${task.comments_count} comentário(s)` : 'Ver comentários'}
                    >
                      <FaComment />
                      {task.comments_count > 0 && (
                        <span style={{ marginLeft: 6, fontWeight: 600 }}>
                          {task.comments_count}
                        </span>
                      )}
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
      
      {modalState.type === 'comments' && (
        <CommentsModal
          task={modalState.task}
          onClose={() => setModalState({ type: null, task: null })}
        />
      )}
    </div>
  );
}

export default Pendencias;