import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { FaPlus, FaCog, FaSearch, FaTrash, FaEdit, FaWarehouse } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './ControleDeEstoque.css';

// --- Modal de Configuração Inicial ---
const InitialConfigModal = ({ onClose, onSave }) => {
  const [config, setConfig] = useState({
    rackName: '',
    niveis: 1,
    enderecos: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(config);
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Bem-vindo! Vamos criar seu primeiro Rack.</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rack-name">Nome do Rack (Ex: Rack 01)</label>
            <input
              type="text"
              id="rack-name"
              value={config.rackName}
              onChange={(e) => setConfig(prev => ({ ...prev, rackName: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="niveis">Quantos níveis (andares) o rack tem?</label>
            <input
              type="number"
              id="niveis"
              min="1"
              value={config.niveis}
              onChange={(e) => setConfig(prev => ({ ...prev, niveis: parseInt(e.target.value) }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="enderecos">Quantos endereços (A, B, C...) por nível?</label>
            <input
              type="number"
              id="enderecos"
              min="1"
              value={config.enderecos}
              onChange={(e) => setConfig(prev => ({ ...prev, enderecos: parseInt(e.target.value) }))}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>
              Cancelar
            </button>
            <button type="submit" className="form-button" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Rack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Modal de Edição de Endereço ---
const EditAddressModal = ({ address, onClose, onSave, onDelete }) => {
  const [items, setItems] = useState(address?.items || []);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1 });
  const [observation, setObservation] = useState(address?.observation || '');
  const [loading, setLoading] = useState(false);

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      setItems(prev => [...prev, { ...newItem, id: Date.now() }]);
      setNewItem({ name: '', quantity: 1 });
    }
  };

  const handleRemoveItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(address.id, { items, observation });
    setLoading(false);
    if (success) onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
      setLoading(true);
      const success = await onDelete(address.id);
      setLoading(false);
      if (success) onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Editar Endereço: {address?.name}</h3>
        
        <div className="items-list">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <span className="item-name">{item.name}</span>
              <span className="item-quantity">Qtd: {item.quantity}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="remove-item-btn"
                title="Remover item"
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="no-items">Nenhum item cadastrado</p>
          )}
        </div>

        <div className="add-item-form">
          <input
            type="text"
            placeholder="Nome do item"
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <input
            type="number"
            placeholder="Qtde"
            min="1"
            value={newItem.quantity}
            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
          />
          <button type="button" onClick={handleAddItem} className="form-button">
            Adicionar Item
          </button>
        </div>

        <hr className="modal-divider" />
        
        <div className="form-group">
          <label htmlFor="observation">Observação:</label>
          <textarea
            id="observation"
            rows="3"
            placeholder="Ex: Equipamento emprestado, aguardando peça..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <div className="modal-info">
            <span>Total de itens: {items.length}</span>
            <span>Quantidade total: {items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="modal-buttons">
            <button
              type="button"
              onClick={handleDelete}
              className="form-button delete-button"
              disabled={loading}
            >
              Excluir Endereço
            </button>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} className="form-button" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Modal de Gerenciamento de Estrutura ---
const StructureManagerModal = ({ onClose, activeRack, racks, refresh }) => {
  const { currentRack, levels, positionsByLevel, maxLevel } = useMemo(() => {
    const rack = racks.find(r => r.id === activeRack) || null;
    const levelSet = new Set((rack?.enderecos || []).map(e => e.nivel));
    const levels = Array.from(levelSet).sort((a,b)=>a-b);
    const posMap = {};
    (rack?.enderecos || []).forEach(e => {
      if (!posMap[e.nivel]) posMap[e.nivel] = new Set();
      posMap[e.nivel].add(e.name);
    });
    const pb = {};
    Object.keys(posMap).forEach(k => pb[k] = Array.from(posMap[k]).sort());
    const maxLevel = levels.length ? levels[levels.length-1] : 0;
    return { currentRack: rack, levels, positionsByLevel: pb, maxLevel };
  }, [activeRack, racks]);

  const [creatingRack, setCreatingRack] = useState({ name: '', niveis: 1, enderecos: 1 });
  const [addLevelCount, setAddLevelCount] = useState(1);
  const [createPositions, setCreatePositions] = useState({ level: '', positions: '' });
  const [removeLevels, setRemoveLevels] = useState('');
  const [removePositions, setRemovePositions] = useState({ level: '', list: [] });
  const [busy, setBusy] = useState(false);
  const [rackToRemove, setRackToRemove] = useState(activeRack || (racks[0]?.id || ''));

  const createRack = async () => {
    setBusy(true);
    const toastId = toast.loading('Criando rack...');
    try {
      const { data: rack, error: rackError } = await supabase
        .from('estoque_racks')
        .insert([{ name: creatingRack.name, niveis: creatingRack.niveis, enderecos_por_nivel: creatingRack.enderecos }])
        .select()
        .single();
      if (rackError) throw rackError;
      const { error: genErr } = await supabase.rpc('generate_rack_addresses', {
        p_rack_id: rack.id,
        p_niveis: creatingRack.niveis,
        p_enderecos_por_nivel: creatingRack.enderecos,
      });
      if (genErr) throw genErr;
      toast.success('Rack criado!', { id: toastId });
      refresh();
      onClose();
    } catch (e) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const addLevels = async () => {
    if (!currentRack) return;
    setBusy(true);
    const toastId = toast.loading('Criando níveis...');
    try {
      const list = Array.from({ length: Math.max(0, parseInt(addLevelCount) || 0) }, (_, i) => maxLevel + 1 + i);
      const { error } = await supabase.rpc('rack_add_levels', { p_rack_id: currentRack.id, p_levels: list });
      if (error) throw error;
      toast.success('Níveis criados!', { id: toastId });
      refresh();
      onClose();
    } catch (e) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const addPositions = async () => {
    if (!currentRack) return;
    const lvl = parseInt(createPositions.level);
    const pos = createPositions.positions.split(',').map(s=>s.trim()).filter(Boolean);
    if (!lvl || pos.length === 0) { toast.error('Selecione nível e posições.'); return; }
    setBusy(true);
    const toastId = toast.loading('Criando posições...');
    try {
      const { error } = await supabase.rpc('rack_add_positions', { p_rack_id: currentRack.id, p_level: lvl, p_positions: pos });
      if (error) throw error;
      toast.success('Posições criadas!', { id: toastId });
      refresh();
      onClose();
    } catch (e) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const removeLevelsAction = async () => {
    if (!currentRack) return;
    const list = removeLevels.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n));
    if (list.length === 0) { toast.error('Informe níveis para remover.'); return; }
    setBusy(true);
    const toastId = toast.loading('Removendo níveis...');
    try {
      const { error } = await supabase.rpc('rack_remove_levels', { p_rack_id: currentRack.id, p_levels: list });
      if (error) throw error;
      toast.success('Níveis removidos!', { id: toastId });
      refresh();
      onClose();
    } catch (e) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const removePositionsAction = async () => {
    if (!currentRack) return;
    const lvl = parseInt(removePositions.level);
    const pos = removePositions.list;
    if (!lvl || pos.length === 0) { toast.error('Selecione nível e posições.'); return; }
    setBusy(true);
    const toastId = toast.loading('Removendo posições...');
    try {
      const { error } = await supabase.rpc('rack_remove_positions', { p_rack_id: currentRack.id, p_level: lvl, p_positions: pos });
      if (error) throw error;
      toast.success('Posições removidas!', { id: toastId });
      refresh();
      onClose();
    } catch (e) {
      toast.error('Erro: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const removeRackAction = async () => {
    const rackId = rackToRemove;
    if (!rackId) { toast.error('Selecione um rack.'); return; }
    if (!window.confirm('Tem certeza que deseja remover este rack e todos os seus endereços? Esta ação não pode ser desfeita.')) return;
    setBusy(true);
    const toastId = toast.loading('Removendo rack...');
    try {
      const { error: delAddrErr } = await supabase.from('estoque_enderecos').delete().eq('rack_id', rackId);
      if (delAddrErr) throw delAddrErr;
      const { error: delRackErr } = await supabase.from('estoque_racks').delete().eq('id', rackId);
      if (delRackErr) throw delRackErr;
      toast.success('Rack removido!', { id: toastId });
      await refresh();
      onClose();
    } catch (e) {
      toast.error('Erro ao remover rack: ' + e.message, { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e=>e.stopPropagation()}>
        <h2>Gerenciar Estrutura</h2>

        <div className="form-group structure-group">
          <h3>Adicionar Rack</h3>
          <p className="help-text">Informe nome, quantidade de níveis e o número de posições por nível.</p>
          <div className="add-item-form">
            <div className="field">
              <label>Nome do Rack</label>
              <input type="text" value={creatingRack.name} onChange={e=>setCreatingRack(v=>({ ...v, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Níveis</label>
              <input type="number" min="1" value={creatingRack.niveis} onChange={e=>setCreatingRack(v=>({ ...v, niveis: parseInt(e.target.value)||1 }))} />
            </div>
            <div className="field">
              <label>Posições por nível</label>
              <input type="number" min="1" value={creatingRack.enderecos} onChange={e=>setCreatingRack(v=>({ ...v, enderecos: parseInt(e.target.value)||1 }))} />
            </div>
            <div className="field field-action">
              <button className="form-button" onClick={createRack} disabled={busy}>Criar</button>
            </div>
          </div>
        </div>

        <hr className="modal-divider" />

        <div className="form-group structure-group">
          <h3>Adicionar Níveis ao Rack Atual</h3>
          <p className="help-text">Quantidade de níveis a adicionar (serão criados após o último nível existente).</p>
          <div className="add-item-form">
            <div className="field">
              <label>Qtd. de níveis</label>
              <input type="number" min="1" value={addLevelCount} onChange={e=>setAddLevelCount(parseInt(e.target.value)||1)} />
            </div>
            <div className="field field-action">
              <button className="form-button" onClick={addLevels} disabled={busy || !currentRack}>Adicionar</button>
            </div>
          </div>
          {!currentRack && <p className="no-items">Selecione um rack nas abas acima.</p>}
        </div>

        <div className="form-group structure-group">
          <h3>Adicionar Posições</h3>
          <p className="help-text">Escolha o nível e informe as posições separadas por vírgula (ex.: A,B,C).</p>
          <div className="add-item-form">
            <div className="field">
              <label>Nível</label>
              <select value={createPositions.level} onChange={e=>setCreatePositions(v=>({ ...v, level: e.target.value }))}>
                <option value="">Selecione…</option>
                {levels.map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Posições</label>
              <input type="text" placeholder="A,B,C" value={createPositions.positions} onChange={e=>setCreatePositions(v=>({ ...v, positions: e.target.value }))} />
            </div>
            <div className="field field-action">
              <button className="form-button" onClick={addPositions} disabled={busy || !currentRack}>Adicionar</button>
            </div>
          </div>
        </div>

        <hr className="modal-divider" />

        <div className="form-group structure-group">
          <h3>Remover Níveis</h3>
          <p className="help-text">Informe os níveis separados por vírgula (ex.: 2,5).</p>
          <div className="add-item-form">
            <div className="field">
              <label>Níveis</label>
              <input type="text" placeholder="2,5" value={removeLevels} onChange={e=>setRemoveLevels(e.target.value)} />
            </div>
            <div className="field field-action">
              <button className="form-button delete-button" onClick={removeLevelsAction} disabled={busy || !currentRack}>Remover</button>
            </div>
          </div>
        </div>

        <div className="form-group structure-group">
          <h3>Remover Posições</h3>
          <p className="help-text">Escolha o nível e selecione as posições a remover.</p>
          <div className="add-item-form">
            <div className="field">
              <label>Nível</label>
              <select value={removePositions.level} onChange={e=>setRemovePositions(v=>({ ...v, level: e.target.value, list: [] }))}>
                <option value="">Selecione…</option>
                {levels.map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Posições</label>
              {(() => {
                const available = positionsByLevel[removePositions.level] || [];
                const allSelected = available.length > 0 && removePositions.list.length === available.length;
                if (available.length === 0) {
                  return <span className="no-items">Nenhuma posição neste nível</span>;
                }
                return (
                  <div className="checks">
                    <div className="checks-header">
                      <label className="check-all">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => setRemovePositions(v => ({ ...v, list: e.target.checked ? available : [] }))}
                        />
                        Selecionar todas
                      </label>
                      <span className="checks-count">{removePositions.list.length} selecionada(s)</span>
                    </div>
                    <div className="checks-grid">
                      {available.map(p => (
                        <label key={p} className="check-item">
                          <input
                            type="checkbox"
                            checked={removePositions.list.includes(p)}
                            onChange={(e) => setRemovePositions(v => ({
                              ...v,
                              list: e.target.checked
                                ? [...v.list, p]
                                : v.list.filter(x => x !== p)
                            }))}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="field field-action">
              <button
                className="form-button delete-button"
                onClick={removePositionsAction}
                disabled={busy || !currentRack || removePositions.list.length === 0}
                title={removePositions.list.length > 0 ? `Remover ${removePositions.list.length} posição(ões)` : 'Selecione ao menos uma posição'}
              >
                {removePositions.list.length > 0 ? `Remover (${removePositions.list.length})` : 'Remover'}
            </button>
      </div>
          </div>
        </div>

        <hr className="modal-divider" />

        <div className="form-group structure-group">
          <h3>Remover Rack</h3>
          <p className="help-text">Selecione um rack para removê-lo definitivamente.</p>
          <div className="add-item-form">
            <div className="field">
              <label>Rack</label>
              <select value={rackToRemove} onChange={e=>setRackToRemove(e.target.value)}>
                {racks.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="field field-action">
              <button className="form-button delete-button" onClick={removeRackAction} disabled={busy || racks.length === 0}>Remover Rack</button>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'12px' }}>
          <button type="button" className="form-button" style={{ background: 'var(--secondary-text-color)' }} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---
function ControleDeEstoque() {
  const [racks, setRacks] = useState([]);
  const [activeRack, setActiveRack] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAllRacks, setSearchAllRacks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [structureOpen, setStructureOpen] = useState(false);

  // Buscar dados iniciais
  const fetchRacks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estoque_racks')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Buscar endereços separadamente
      const racksWithAddresses = await Promise.all(
        data.map(async (rack) => {
          const { data: enderecos, error: enderecosError } = await supabase
            .from('estoque_enderecos')
            .select('*')
            .eq('rack_id', rack.id)
            .order('name');
          
          if (enderecosError) throw enderecosError;
          
          return {
            ...rack,
            enderecos: enderecos || []
          };
        })
      );
      
      setRacks(racksWithAddresses || []);
      
      if (racksWithAddresses && racksWithAddresses.length > 0 && !activeRack) {
        setActiveRack(racksWithAddresses[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar racks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRacks();
  }, []);

  // Criar rack inicial
  const handleCreateInitialRack = async (config) => {
    const toastId = toast.loading('Criando rack...');
    try {
      // Criar rack
      const { data: rack, error: rackError } = await supabase
        .from('estoque_racks')
        .insert([{
          name: config.rackName,
          niveis: config.niveis,
          enderecos_por_nivel: config.enderecos
        }])
        .select()
        .single();

      if (rackError) throw rackError;

      // Gerar endereços usando a função SQL
      const { error: generateError } = await supabase.rpc('generate_rack_addresses', {
        p_rack_id: rack.id,
        p_niveis: config.niveis,
        p_enderecos_por_nivel: config.enderecos
      });

      if (generateError) throw generateError;

      toast.success('Rack criado com sucesso!', { id: toastId });
      fetchRacks();
      return true;
    } catch (error) {
      toast.error('Erro ao criar rack: ' + error.message, { id: toastId });
      return false;
    }
  };

  // Salvar endereço
  const handleSaveAddress = async (addressId, data) => {
    const toastId = toast.loading('Salvando...');
    try {
      const { error } = await supabase
        .from('estoque_enderecos')
        .update({
          items: data.items,
          observation: data.observation
        })
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Endereço atualizado!', { id: toastId });
      fetchRacks();
      return true;
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message, { id: toastId });
      return false;
    }
  };

  // Excluir endereço
  const handleDeleteAddress = async (addressId) => {
    const toastId = toast.loading('Excluindo...');
    try {
      const { error } = await supabase
        .from('estoque_enderecos')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Endereço excluído!', { id: toastId });
      fetchRacks();
      return true;
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message, { id: toastId });
      return false;
    }
  };

  // Adicionar nível ao rack
  const handleAddLevel = async () => {
    if (!activeRack) {
      toast.error('Selecione um rack primeiro');
      return;
    }

    const toastId = toast.loading('Adicionando nível...');
    try {
      const { error } = await supabase.rpc('add_rack_level', {
        p_rack_id: activeRack
      });

      if (error) throw error;
      toast.success('Nível adicionado com sucesso!', { id: toastId });
      fetchRacks();
    } catch (error) {
      toast.error('Erro ao adicionar nível: ' + error.message, { id: toastId });
    }
  };

  // Remover último nível do rack
  const handleRemoveLevel = async () => {
    if (!activeRack) {
      toast.error('Selecione um rack primeiro');
      return;
    }

    if (!window.confirm('Tem certeza que deseja remover o último nível? Esta ação não pode ser desfeita.')) {
      return;
    }

    const toastId = toast.loading('Removendo nível...');
    try {
      const { error } = await supabase.rpc('remove_rack_level', {
        p_rack_id: activeRack
      });

      if (error) throw error;
      toast.success('Nível removido com sucesso!', { id: toastId });
      fetchRacks();
    } catch (error) {
      toast.error('Erro ao remover nível: ' + error.message, { id: toastId });
    }
  };

  // Adicionar endereço ao rack
  const handleAddAddress = async () => {
    if (!activeRack) {
      toast.error('Selecione um rack primeiro');
      return;
    }

    const toastId = toast.loading('Adicionando endereço...');
    try {
      const { error } = await supabase.rpc('add_rack_address', {
        p_rack_id: activeRack
      });

      if (error) throw error;
      toast.success('Endereço adicionado com sucesso!', { id: toastId });
      fetchRacks();
    } catch (error) {
      toast.error('Erro ao adicionar endereço: ' + error.message, { id: toastId });
    }
  };

  // Remover último endereço do rack
  const handleRemoveAddress = async () => {
    if (!activeRack) {
      toast.error('Selecione um rack primeiro');
      return;
    }

    if (!window.confirm('Tem certeza que deseja remover o último endereço? Esta ação não pode ser desfeita.')) {
      return;
    }

    const toastId = toast.loading('Removendo endereço...');
    try {
      const { error } = await supabase.rpc('remove_rack_address', {
        p_rack_id: activeRack
      });

      if (error) throw error;
      toast.success('Endereço removido com sucesso!', { id: toastId });
      fetchRacks();
    } catch (error) {
      toast.error('Erro ao remover endereço: ' + error.message, { id: toastId });
    }
  };

  // Organizar endereços por níveis
  const organizedAddresses = useMemo(() => {
    if (!activeRack) return [];
    
    const rack = racks.find(r => r.id === activeRack);
    if (!rack || !rack.enderecos) return [];

    let addresses = rack.enderecos;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      addresses = addresses.filter(addr => {
        // Buscar no nome do endereço
        if (addr.name.toLowerCase().includes(searchLower)) return true;
        
        // Buscar nos itens
        if (addr.items && addr.items.some(item => 
          item.name.toLowerCase().includes(searchLower)
        )) return true;
        
        // Buscar na observação
        if (addr.observation && addr.observation.toLowerCase().includes(searchLower)) return true;
        
        return false;
      });
    }

    // Organizar por níveis
    const levels = {};
    addresses.forEach(addr => {
      const nivel = addr.nivel;
      if (!levels[nivel]) {
        levels[nivel] = [];
      }
      levels[nivel].push(addr);
    });

    // Ordenar níveis e endereços dentro de cada nível
    return Object.keys(levels)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(nivel => ({
        nivel: parseInt(nivel),
        enderecos: levels[nivel].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }, [racks, activeRack, searchTerm]);

  // Busca em todos os racks
  const searchResults = useMemo(() => {
    if (!searchAllRacks || !searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    const results = [];
    
    racks.forEach(rack => {
      if (rack.enderecos) {
        rack.enderecos.forEach(addr => {
          let match = false;
          
          if (addr.name.toLowerCase().includes(searchLower)) match = true;
          if (addr.items && addr.items.some(item => item.name.toLowerCase().includes(searchLower))) match = true;
          if (addr.observation && addr.observation.toLowerCase().includes(searchLower)) match = true;
          
          if (match) {
            results.push({ ...addr, rackName: rack.name });
          }
        });
      }
    });
    
    return results;
  }, [racks, searchTerm, searchAllRacks]);

  if (loading) return <div className="loading-state">Carregando estoque...</div>;

  return (
    <div className="historico-container">
      {/* Header */}
      <div className="assets-page-header">
        <h1>📦 Controle de Estoque</h1>
        <div className="search-and-actions">
          <div className="search-container">
            <input
              type="search"
              placeholder="Buscar por item, endereço ou observação..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="search-options">
              <label>
                <input
                  type="checkbox"
                  checked={searchAllRacks}
                  onChange={(e) => setSearchAllRacks(e.target.checked)}
                />
                Buscar em todos os racks
              </label>
            </div>
          </div>
          <button
            className="form-button"
            onClick={(e) => {
              setStructureOpen(true);
            }}
          >
            <FaCog />
            Configurações
          </button>
        </div>
      </div>

      {/* Abas dos Racks */}
      {racks.length > 0 && (
        <div className="asset-tabs">
          {racks.map(rack => (
            <button
              key={rack.id}
              onClick={() => setActiveRack(rack.id)}
              className={activeRack === rack.id ? 'active' : ''}
            >
              {rack.name}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="estoque-content">
        {racks.length === 0 ? (
          <div className="empty-state">
            <FaWarehouse size={64} />
            <h2>Nenhum rack configurado</h2>
            <p>Clique em "Configurações" para criar seu primeiro rack</p>
          </div>
        ) : searchAllRacks && searchTerm ? (
          // Resultados da busca global
          <div className="search-results">
            <h3>Resultados da busca: "{searchTerm}"</h3>
            <div className="addresses-grid">
              {searchResults.map(addr => (
                <div key={addr.id} className="address-card">
                  <div className="address-header">
                    <span className="address-name">{addr.name}</span>
                    <span className="rack-name">{addr.rackName}</span>
                  </div>
                  <div className="address-items">
                    {addr.items && addr.items.length > 0 ? (
                      addr.items.map((item, idx) => (
                        <div key={idx} className="item-display">
                          <span>{item.name}</span>
                          <span className="quantity">Qtd: {item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <span className="no-items">Vazio</span>
                    )}
                  </div>
                  <button
                    className="edit-address-btn"
                    onClick={() => setModalState({ type: 'edit', data: addr })}
                  >
                    <FaEdit />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Visualização normal do rack ativo
          <div className="rack-view">
            {activeRack && (
              <div className="levels-container">
                {organizedAddresses.map((level, levelIndex) => (
                  <div key={level.nivel} className="level-section">
                    <div className="level-header">
                      <span className="level-name">Nível {level.nivel}</span>
                      <div className="level-addresses">
                        {level.enderecos.map((addr, addrIndex) => (
                          <div key={addr.id} className="address-card">
                            <div className="address-header">
                              <span className="address-name">{addr.name}</span>
                            </div>
                            <div className="address-items">
                              {addr.items && addr.items.length > 0 ? (
                                addr.items.map((item, idx) => (
                                  <div key={idx} className="item-display">
                                    <span>{item.name}</span>
                                    <span className="quantity">Qtd: {item.quantity}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="no-items">Vazio</span>
                              )}
                            </div>
                            <button
                              className="edit-address-btn"
                              onClick={() => setModalState({ type: 'edit', data: addr })}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {modalState.type === 'initial-config' && (
        <InitialConfigModal
          onClose={() => setModalState({ type: null, data: null })}
          onSave={handleCreateInitialRack}
        />
      )}

      {modalState.type === 'edit' && (
        <EditAddressModal
          address={modalState.data}
          onClose={() => setModalState({ type: null, data: null })}
          onSave={handleSaveAddress}
          onDelete={handleDeleteAddress}
        />
      )}

      {/* Menu de Configurações */}
      {structureOpen && (
        <StructureManagerModal
          onClose={() => setStructureOpen(false)}
          activeRack={activeRack}
          racks={racks}
          refresh={fetchRacks}
        />
      )}
    </div>
  );
}

export default ControleDeEstoque;