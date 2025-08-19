import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaPlus, FaRandom, FaKey, FaTrash } from 'react-icons/fa';
import './Senhas.css';

function PasswordGenerator({ onGenerate }) {
  const [length, setLength] = useState(12);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [preview, setPreview] = useState('');
  const [show, setShow] = useState(false);

  const generatePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{};:,.<>?';
    let charset = '';
    if (useUpper) charset += upper;
    if (useLower) charset += lower;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;
    if (!charset) {
      toast.error('Selecione ao menos um conjunto de caracteres.');
      return;
    }
    let pwd = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      pwd += charset[array[i] % charset.length];
    }
    setPreview(pwd);
    setShow(false);
    onGenerate(pwd);
  };

  return (
    <div className="generator-panel">
      <div className="form-row">
        <label>Tamanho</label>
        <input type="number" min="4" max="64" value={length} onChange={e => setLength(parseInt(e.target.value || '0'))} />
      </div>
      <div className="form-row options">
        <label><input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} /> Maiúsculas</label>
        <label><input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} /> Minúsculas</label>
        <label><input type="checkbox" checked={useNumbers} onChange={e => setUseNumbers(e.target.checked)} /> Números</label>
        <label><input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} /> Especiais</label>
      </div>
      <div className="generator-actions">
        <button className="form-button" onClick={generatePassword}><FaRandom style={{ marginRight: 8 }} />Gerar</button>
        {preview && (
          <div className="generated-box">
            <input type={show ? 'text' : 'password'} value={preview} readOnly />
            <button className="icon-button" onClick={() => setShow(s => !s)} title={show ? 'Ocultar' : 'Exibir'}>
              {show ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Senhas() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [newEquipamento, setNewEquipamento] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [query, setQuery] = useState('');

  const canManage = useMemo(() => !!user, [user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('senhas')
        .select('id, equipamento, senha, updated_at, updated_by')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const rows = data || [];
      const userIds = Array.from(new Set(rows.map(r => r.updated_by).filter(Boolean)));
      let userMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        (profilesData || []).forEach(p => { userMap[p.id] = p.full_name; });
      }

      setItems(rows.map(r => ({ ...r, updated_by_name: userMap[r.updated_by] })));
    } catch (error) {
      toast.error('Erro ao carregar senhas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => (i.equipamento || '').toLowerCase().includes(q));
  }, [items, query]);

  const handleAdd = async () => {
    if (!newEquipamento) {
      toast.error('Informe o nome do equipamento.');
      return;
    }
    const toastId = toast.loading('Salvando...');
    try {
      const { error } = await supabase.from('senhas').insert({
        equipamento: newEquipamento,
        senha: newSenha || null,
        updated_by: user.id,
      });
      if (error) throw error;
      toast.success('Registro criado!', { id: toastId });
      setNewEquipamento('');
      setNewSenha('');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message, { id: toastId });
    }
  };

  const handleUpdateSenha = async (id, senha) => {
    const toastId = toast.loading('Atualizando...');
    try {
      const { error } = await supabase.from('senhas').update({ senha: senha, updated_by: user.id }).eq('id', id);
      if (error) throw error;
      toast.success('Senha atualizada!', { id: toastId });
      fetchItems();
    } catch (error) {
      toast.error('Erro ao atualizar: ' + error.message, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este registro?')) return;
    const toastId = toast.loading('Excluindo...');
    try {
      const { error } = await supabase.from('senhas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Excluído!', { id: toastId });
      fetchItems();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message, { id: toastId });
    }
  };

  const [visibleIds, setVisibleIds] = useState(new Set());
  const toggleVisibility = (id) => {
    setVisibleIds(prev => {
      const clone = new Set(prev);
      if (clone.has(id)) clone.delete(id); else clone.add(id);
      return clone;
    });
  };

  useEffect(() => {
    if (showAll) {
      setVisibleIds(new Set(items.map(i => i.id)));
    } else {
      setVisibleIds(new Set());
    }
  }, [showAll, items]);

  const [generated, setGenerated] = useState('');
  const onGenerate = (pwd) => {
    setGenerated(pwd);
    setTimeout(() => {
      if (window.confirm('Deseja preencher a senha gerada para o equipamento novo?')) {
        setNewSenha(pwd);
      }
    }, 0);
  };

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1><FaKey style={{ marginRight: 8 }} /> Senhas</h1>
        <div className="search-and-actions">
          <div className="toolbar-group">
            <input
              type="text"
              placeholder="Pesquisar equipamento..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="toolbar-input"
            />
            <button className="form-button" onClick={() => setShowAll(s => !s)}>
              {showAll ? <><FaEyeSlash style={{ marginRight: 8 }} />Ocultar Todas</> : <><FaEye style={{ marginRight: 8 }} />Exibir Todas</>}
            </button>
          </div>
        </div>
      </div>

      <div className="senhas-grid">
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Adicionar Senha</h3>
          </div>
          <div className="section-content">
            <div className="add-form">
              <input
                type="text"
                placeholder="Nome do Equipamento"
                value={newEquipamento}
                onChange={e => setNewEquipamento(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha (opcional)"
                value={newSenha}
                onChange={e => setNewSenha(e.target.value)}
              />
              <button className="form-button" onClick={handleAdd}>
                <FaPlus style={{ marginRight: 8 }} />Salvar
              </button>
            </div>
          </div>
        </div>

        <div className="section-card generator-card">
          <div className="section-header">
            <h3 className="section-title">Gerador</h3>
          </div>
          <div className="section-content">
            <PasswordGenerator onGenerate={onGenerate} />
          </div>
        </div>
      </div>

      <div className="asset-table-container">
        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">Nenhum registro.</div>
        ) : (
          <div className="passwords-grid">
            {filteredItems.map(item => {
              const isVisible = visibleIds.has(item.id);
              const updatedByName = item.updated_by_name || item.updated_by || '';
              return (
                <div key={item.id} className="password-card">
                  <div className="password-card-header">
                    <h3 className="password-title">{item.equipamento}</h3>
                    <button className="danger-button" onClick={() => handleDelete(item.id)} title="Excluir">
                      <FaTrash />
                    </button>
                  </div>
                  <div className="password-card-body">
                    <div className="password-cell">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={item.senha || ''}
                        onChange={e => handleUpdateSenha(item.id, e.target.value)}
                        placeholder="(vazio)"
                      />
                      <button className="icon-button" onClick={() => toggleVisibility(item.id)}>
                        {isVisible ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="password-card-footer">
                    <span className="muted">{item.updated_at ? new Date(item.updated_at).toLocaleString('pt-BR') : '-'}</span>
                    <span className="muted">{updatedByName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Senhas;


