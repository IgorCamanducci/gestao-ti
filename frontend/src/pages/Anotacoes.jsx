import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaLock, FaUnlock, FaTrash } from 'react-icons/fa';
import './Inventario.css';

function Anotacoes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', is_public: false });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, is_public, owner_id, created_at, updated_at')
        .or(`is_public.eq.true,owner_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (e) {
      console.error('Erro ao carregar anotações:', e);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchNotes(); }, [user]);

  const openNew = () => { setEditing(null); setForm({ title: '', content: '', is_public: false }); setModalOpen(true); };
  const openEdit = (note) => { setEditing(note); setForm({ title: note.title, content: note.content, is_public: note.is_public }); setModalOpen(true); };

  const saveNote = async (e) => {
    e.preventDefault();
    const payload = { ...form, owner_id: user.id };
    const { error } = editing
      ? await supabase.from('notes').update(payload).eq('id', editing.id)
      : await supabase.from('notes').insert(payload);
    if (!error) { setModalOpen(false); fetchNotes(); }
  };

  const removeNote = async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('owner_id', user.id);
    if (!error) {
      fetchNotes();
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (note) => {
    setDeleteConfirm(note);
  };

  if (loading) return <div className="loading-state">Carregando anotações...</div>;

  return (
    <div className="historico-container" style={{ minHeight: 'auto', height: 'fit-content' }}>
      <div className="assets-page-header">
        <h1>📝 Anotações</h1>
        <div className="search-and-actions">
          <button className="form-button" onClick={openNew}><FaPlus style={{ marginRight: 8 }} />Nova Anotação</button>
        </div>
      </div>

      <div className="categories-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {notes.map(n => (
          <div key={n.id} className="category-card" style={{ 
            position: 'relative', 
            minHeight: '200px',
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="category-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 'var(--spacing-md)',
              paddingBottom: 'var(--spacing-sm)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div className="category-info" onClick={() => openEdit(n)} style={{ cursor: 'pointer', flex: 1 }}>
                <h3 className="category-name" style={{ fontSize: 'var(--font-size-base)', marginBottom: '4px' }}>
                  {n.title || 'Sem título'}
                </h3>
                <p className="category-total" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  fontSize: 'var(--font-size-sm)',
                  margin: 0
                }}>
                  {n.is_public ? <FaUnlock size={12} /> : <FaLock size={12} />} 
                  {n.is_public ? 'Pública' : 'Pessoal'}
                </p>
              </div>
              {n.owner_id === user.id && (
                <button 
                  className="delete-note-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(n);
                  }}
                  style={{
                    background: '#dc3545',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    marginLeft: '8px',
                    minWidth: '32px',
                    height: '32px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#c82333';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#dc3545';
                    e.target.style.transform = 'scale(1)';
                  }}
                  title="Excluir anotação"
                >
                  <FaTrash size={12} />
                </button>
              )}
            </div>
            <div 
              className="category-stats" 
              onClick={() => openEdit(n)} 
              style={{ 
                cursor: 'pointer', 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="stat-item" style={{ 
                display: 'block',
                background: 'transparent',
                padding: 0,
                minHeight: 'auto'
              }}>
                <span className="stat-value" style={{ 
                  whiteSpace: 'pre-wrap',
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.4',
                  color: 'var(--secondary-text-color)',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {n.content?.slice(0, 200) || 'Sem conteúdo...'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <h3>Nenhuma anotação</h3>
            <p>Crie sua primeira anotação com o botão acima.</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <h2>{editing ? 'Editar' : 'Nova'} Anotação</h2>
            <form onSubmit={saveNote} className="login-form">
              <div className="form-group">
                <label>Título</label>
                <input type="text" value={form.title} onChange={(e)=>setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Conteúdo</label>
                <textarea rows={8} value={form.content} onChange={(e)=>setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input id="pub" type="checkbox" checked={form.is_public} onChange={(e)=>setForm({ ...form, is_public: e.target.checked })} />
                <label htmlFor="pub">Tornar pública (visível a todos)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="form-button" style={{ background: 'var(--secondary-text-color)' }} onClick={()=>setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="form-button">Salvar</button>
                {editing && <button type="button" className="form-button" style={{ background: 'var(--danger-color)' }} onClick={()=>removeNote(editing.id)}>Excluir</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <h2>Confirmar Exclusão</h2>
            <p>Tem certeza que deseja excluir a anotação <strong>"{deleteConfirm.title || 'Sem título'}"</strong>?</p>
            <p style={{ color: 'var(--warning-color)', fontSize: 'var(--font-size-sm)' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button 
                type="button" 
                className="form-button" 
                style={{ background: 'var(--secondary-text-color)' }} 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="form-button" 
                style={{ 
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  opacity: 1
                }} 
                onClick={() => removeNote(deleteConfirm.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Anotacoes;


