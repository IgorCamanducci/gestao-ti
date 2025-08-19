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

// --- Menu de Configurações ---
const SettingsMenu = ({ position, onClose, onAddRack, onAddLevel, onAddAddress, onRemoveLevel, onRemoveAddress, activeRack, racks }) => {
  const menuRef = useRef();
  const currentRack = racks.find(r => r.id === activeRack);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={menuRef} className="settings-menu" style={{ top: position.top, left: position.left }}>
      <div className="menu-section">
        <div className="menu-header">Gerenciar Rack</div>
        <button onClick={onAddRack}>
          <FaPlus />
          Adicionar Novo Rack
        </button>
        
        {currentRack && (
          <>
            <div className="rack-info">
              <strong>{currentRack.name}</strong>
              <span>{currentRack.niveis} níveis × {currentRack.enderecos_por_nivel} endereços</span>
            </div>
            <button onClick={onAddLevel}>
              <FaPlus />
              Adicionar Nível
            </button>
            <button onClick={onAddAddress}>
              <FaPlus />
              Adicionar Endereço
            </button>
            <button onClick={onRemoveLevel} className="danger-action">
              <FaTrash />
              Remover Último Nível
            </button>
            <button onClick={onRemoveAddress} className="danger-action">
              <FaTrash />
              Remover Último Endereço
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
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
  const [settingsMenu, setSettingsMenu] = useState({ show: false, position: null });

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
              const rect = e.currentTarget.getBoundingClientRect();
              setSettingsMenu({
                show: true,
                position: { top: rect.bottom + 5, left: rect.left }
              });
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
      {settingsMenu.show && (
        <SettingsMenu
          position={settingsMenu.position}
          onClose={() => setSettingsMenu({ show: false, position: null })}
          onAddRack={() => {
            setModalState({ type: 'initial-config', data: null });
            setSettingsMenu({ show: false, position: null });
          }}
          onAddLevel={() => {
            handleAddLevel();
            setSettingsMenu({ show: false, position: null });
          }}
          onAddAddress={() => {
            handleAddAddress();
            setSettingsMenu({ show: false, position: null });
          }}
          onRemoveLevel={() => {
            handleRemoveLevel();
            setSettingsMenu({ show: false, position: null });
          }}
          onRemoveAddress={() => {
            handleRemoveAddress();
            setSettingsMenu({ show: false, position: null });
          }}
          activeRack={activeRack}
          racks={racks}
        />
      )}
    </div>
  );
}

export default ControleDeEstoque;