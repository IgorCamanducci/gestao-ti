import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaLock, FaUnlock } from 'react-icons/fa';
import './Inventario.css';

function Anotacoes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', is_public: false });

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
    if (!error) fetchNotes();
  };

  if (loading) return <div className="loading-state">Carregando anotações...</div>;

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>📝 Anotações</h1>
        <div className="search-and-actions">
          <button className="form-button" onClick={openNew}><FaPlus style={{ marginRight: 8 }} />Nova Anotação</button>
        </div>
      </div>

      <div className="categories-grid">
        {notes.map(n => (
          <div key={n.id} className="category-card" onClick={() => openEdit(n)} style={{ cursor: 'pointer' }}>
            <div className="category-header">
              <div className="category-info">
                <h3 className="category-name">{n.title || 'Sem título'}</h3>
                <p className="category-total" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {n.is_public ? <FaUnlock /> : <FaLock />} {n.is_public ? 'Pública' : 'Pessoal'}
                </p>
              </div>
            </div>
            <div className="category-stats" style={{ display: 'block' }}>
              <div className="stat-item" style={{ display: 'block' }}>
                <span className="stat-label" style={{ display: 'block', marginBottom: 6 }}>Conteúdo</span>
                <span className="stat-value" style={{ whiteSpace: 'pre-wrap' }}>{n.content?.slice(0, 400) || '...'}</span>
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
    </div>
  );
}

export default Anotacoes;


