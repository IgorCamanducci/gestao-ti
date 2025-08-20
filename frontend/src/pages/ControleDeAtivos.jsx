import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus, FaWrench, FaBoxOpen, FaEdit, FaTrash, FaArchive } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './ControleDeAtivos.css';
import './Usuarios.css';

// --- Menu de Ações com Portal ---
const ActionsMenu = ({ asset, position, onClose, onEdit, onDelete, onDecommission, onSendToMaintenance }) => {
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
      <button onClick={() => onEdit(asset)}>Editar</button>
      {asset.status !== 'Descartado' && <button onClick={() => onSendToMaintenance(asset)}>Enviar para Manutenção</button>}
      {asset.status !== 'Descartado' && <button onClick={() => onDecommission(asset)}>Dar Baixa</button>}
      <button onClick={() => onDelete(asset.id)} className="delete-button-text">Excluir</button>
    </div>,
    document.body
  );
};

// --- Modal para Adicionar/Editar Ativo ---
const AssetModal = ({ onClose, onSave, existingAsset, categories, fieldsConfig = {} }) => {
  const [asset, setAsset] = useState(
    existingAsset || {
      serial_number: '',
      category: categories[0]?.name || '', 
      status: 'Em estoque',
      metadata: {}
    }
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setAsset(prev => ({ ...prev, [name]: value, metadata: {} }));
    } else {
      setAsset(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleMetadataChange = (fieldName, value) => {
    setAsset(prev => ({ ...prev, metadata: { ...prev.metadata, [fieldName]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSave(asset, !!existingAsset);
    setLoading(false);
    if (success) onClose();
  };

  const customFields = fieldsConfig[asset.category] || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{existingAsset ? 'Editar' : 'Adicionar Novo'} Ativo</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Categoria</label>
            <select name="category" value={asset.category} onChange={handleChange} disabled={categories.length === 0}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>Número de Série *</label>
            <input 
              name="serial_number" 
              type="text" 
              value={asset.serial_number} 
              onChange={handleChange} 
              required 
              disabled={!!existingAsset}
              placeholder="Digite o número de série"
            />
          </div>
          
          <div className="form-group">
            <label>Status *</label>
            <select name="status" value={asset.status} onChange={handleChange} required>
              <option value="Em estoque">Em estoque</option>
              <option value="Em uso">Em uso</option>
            </select>
          </div>
          
          {customFields.map(field => (
            <div className="form-group" key={field.id}>
              <label>{field.field_label}</label>
              <input 
                type={field.field_type} 
                value={asset.metadata?.[field.field_name] || ''} 
                onChange={e => handleMetadataChange(field.field_name, e.target.value)}
                required={field.field_label.toLowerCase().includes('obrigatório') || 
                         field.field_label.toLowerCase().includes('nome') ||
                         field.field_label.toLowerCase().includes('número') ||
                         field.field_label.toLowerCase().includes('imei')}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
            <button type="submit" className="form-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Ativo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Modal para Dar Baixa ---
const DecommissionModal = ({ asset, onClose, onDecommission }) => {
    const [reason, setReason] = useState('');
    const [decommissionDate, setDecommissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await onDecommission(asset.id, reason, decommissionDate);
            if (success) {
                onClose();
            }
        } catch (err) {
            console.error('Erro no modal de baixa:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Dar Baixa no Ativo</h2>
                <p>O status do ativo será alterado para "Descartado". O ativo sairá desta tela de controle.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="decommission_date">Data da Baixa</label>
                        <input type="date" id="decommission_date" value={decommissionDate} onChange={(e) => setDecommissionDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="decommission_reason">Motivo da Baixa (Opcional)</label>
                        <textarea id="decommission_reason" rows="4" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
                        <button type="submit" className="form-button" disabled={loading} style={{ background: '#dc3545' }}>{loading ? 'Confirmando...' : 'Confirmar Baixa'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Modal para Enviar para Manutenção ---
const MaintenanceModal = ({ asset, onClose, onSave }) => {
    const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await onSave(asset.id, { maintenanceDate, description });
        setLoading(false);
        if (success) onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Enviar para Manutenção</h2>
                <p>O status do ativo será "Em manutenção" e um registro será criado no histórico.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="maintenance_date">Data de Envio</label>
                        <input id="maintenance_date" type="date" value={maintenanceDate} onChange={e => setMaintenanceDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Motivo / Descrição do Problema</label>
                        <textarea id="description" rows="4" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" onClick={onClose} className="form-button" style={{ background: 'var(--secondary-text-color)' }}>Cancelar</button>
                        <button type="submit" className="form-button" disabled={loading}>{loading ? 'Enviando...' : 'Enviar para Manutenção'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal da Página ---
function ControleDeAtivos() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fieldsConfig, setFieldsConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState({ type: null, asset: null });
  const [menuState, setMenuState] = useState({ asset: null, position: null });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [assetsRes, categoriesRes, fieldsRes] = await Promise.all([
        supabase.from('ativos').select('*').neq('status', 'Descartado').neq('status', 'Em manutenção').order('created_at', { ascending: true }),
        supabase.from('asset_categories').select('*').order('name'),
        supabase.from('asset_category_fields').select('*').order('display_order')
      ]);
      
      if (assetsRes.error) throw assetsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (fieldsRes.error) throw fieldsRes.error;

      setAssets(assetsRes.data);
      const fetchedCategories = categoriesRes.data;
      setCategories(fetchedCategories);
      
      if (fetchedCategories.length > 0 && !activeTab) {
        setActiveTab(fetchedCategories[0].name);
      } else if (fetchedCategories.length === 0) {
        setActiveTab(null);
      }
      
      const categoryIdToNameMap = fetchedCategories.reduce((acc, cat) => ({...acc, [cat.id]: cat.name}), {});
      const fieldsByCatName = fieldsRes.data.reduce((acc, field) => {
        const catName = categoryIdToNameMap[field.category_id];
        if (catName) {
            if (!acc[catName]) acc[catName] = [];
            acc[catName].push(field);
        }
        return acc;
      }, {});
      setFieldsConfig(fieldsByCatName);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSaveAsset = async (assetData, isEditing) => {
    try {
      const toastId = toast.loading(isEditing ? 'Atualizando ativo...' : 'Criando ativo...');
      
      // Validar se o número de série foi preenchido
      if (!assetData.serial_number || assetData.serial_number.trim() === '') {
        toast.error('Número de série é obrigatório!', { id: toastId });
        return false;
      }
      
      // Preparar dados para salvar
      const dataToSave = {
        category: assetData.category,
        serial_number: assetData.serial_number.trim(),
        status: assetData.status,
        metadata: assetData.metadata || {}
      };

      // Se for edição, incluir o ID
      if (isEditing && assetData.id) {
        dataToSave.id = assetData.id;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('ativos')
          .update(dataToSave)
          .eq('id', assetData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ativos')
          .insert(dataToSave);
        if (error) throw error;
      }
      toast.success(isEditing ? 'Ativo atualizado!' : 'Ativo criado!', { id: toastId });
      fetchInitialData();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
      const toastId = toast.loading('Excluindo ativo...');
      const { error } = await supabase.from('ativos').delete().eq('id', assetId);
      if (error) toast.error(error.message, { id: toastId });
      else {
        toast.success('Ativo excluído!', { id: toastId });
        fetchInitialData();
      }
    }
  };

  const handleDecommissionAsset = async (assetId, reason, decommissionDate) => {
    try {
      const toastId = toast.loading('Registrando baixa...');
      
      // Atualizar o ativo diretamente na tabela ativos
      const { error } = await supabase
        .from('ativos')
        .update({
          status: 'Descartado',
          decommission_date: decommissionDate,
          decommission_reason: reason,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', assetId);

      if (error) throw error;
      
      toast.success('Baixa registrada com sucesso!', { id: toastId });
      // Recarregar dados e fechar modal
      await fetchInitialData();
      return true;
    } catch (error) {
      toast.error('Erro ao dar baixa: ' + error.message);
      return false;
    }
  };

  const handleSendToMaintenance = async (assetId, { maintenanceDate, description }) => {
    try {
      const toastId = toast.loading('Enviando para manutenção...');
      
      // Atualizar status do ativo
      const { error: updateError } = await supabase
        .from('ativos')
        .update({ status: 'Em manutenção' })
        .eq('id', assetId);

      if (updateError) throw updateError;

      // Registrar na tabela de manutenção
      const { error: maintenanceError } = await supabase
        .from('manutencao_ativos')
        .insert([{
          asset_id: assetId,
          maintenance_date: maintenanceDate,
          description: description,
          performed_by: (await supabase.auth.getUser()).data.user?.id || 'Sistema'
        }]);

      if (maintenanceError) throw maintenanceError;

      toast.success('Ativo enviado para manutenção!', { id: toastId });
      fetchInitialData();
      return true;
    } catch (error) {
      toast.error('Erro ao enviar para manutenção: ' + error.message);
      return false;
    }
  };

  const handleMenuClick = (asset, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 160; // Largura estimada do menu
    const windowWidth = window.innerWidth;
    
    // Calcular posição horizontal
    let left = rect.left + window.scrollX;
    
    // Se o menu vai sair da tela pela direita, posicionar à esquerda do botão
    if (left + menuWidth > windowWidth - 20) {
      left = rect.right + window.scrollX - menuWidth;
    }
    
    // Garantir que não saia pela esquerda
    if (left < 20) {
      left = 20;
    }
    
    setMenuState({
      asset,
      position: {
        top: rect.bottom + window.scrollY + 5,
        left: left
      }
    });
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => 
      (activeTab === null || asset.category === activeTab) &&
      (searchTerm.trim() === '' || 
        // Buscar no número de série
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        // Buscar no status
        (asset.status && asset.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        // Buscar nos campos configurados
        Object.values(asset.metadata || {}).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  }, [assets, activeTab, searchTerm]);
  
  const currentHeaders = useMemo(() => {
    // Se não há categoria ativa ou não há configuração, não mostra nada
    if (!activeTab || !fieldsConfig[activeTab]) {
      return [];
    }
    
    // Busca os campos configurados para a categoria ativa
    const customFields = fieldsConfig[activeTab] || [];
    const customHeaders = customFields.map(f => f.field_label);
    
    // Retorna número de série + campos configurados
    return ['Número de Série', ...customHeaders];
  }, [activeTab, fieldsConfig]);

  const getAssetValue = (asset, header) => {
    // Se for número de série, retorna direto
    if (header === 'Número de Série') {
      return asset.serial_number || '---';
    }
    
    // Busca o campo configurado pelo label
    const categoryFields = fieldsConfig[asset.category] || [];
    const fieldConfig = categoryFields.find(f => f.field_label === header);
    
    if (fieldConfig && asset.metadata) {
      return asset.metadata[fieldConfig.field_name] || '---';
    }
    
    return '---';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Em estoque': return 'status-em-estoque';
      case 'Em uso': return 'status-em-uso';
      case 'Em manutenção': return 'status-em-manutencao';
      default: return '';
    }
  };

  return (
    <div className="historico-container">
      <div className="assets-page-header">
        <h1>📦 Controle de Ativos</h1>
        <div className="search-and-actions">
          <input
            type="text"
            placeholder="Buscar ativos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="form-button" onClick={() => setModalState({ type: 'add', asset: null })}>
            <FaPlus style={{ marginRight: '8px' }} />
            Novo Ativo
          </button>
        </div>
      </div>

      {/* Abas de Categorias */}
      <div className="asset-tabs">
        <button
          className={activeTab === null ? 'active' : ''}
          onClick={() => setActiveTab(null)}
        >
          Todas ({filteredAssets.length})
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            className={activeTab === category.name ? 'active' : ''}
            onClick={() => setActiveTab(category.name)}
          >
            {category.name} ({filteredAssets.filter(asset => asset.category === category.name).length})
          </button>
        ))}
      </div>

      <div className="asset-table-container">
        {loading ? (
          <div className="loading-state">Carregando ativos...</div>
        ) : filteredAssets.length > 0 ? (
          <div className="assets-grid">
            {filteredAssets.map(asset => (
              <div key={asset.id} className={`asset-card status-${asset.status.replace(' ', '-').toLowerCase()}`}>
                <div className="asset-header">
                  <h3 className="asset-serial">{asset.serial_number || 'Sem número de série'}</h3>
                  <span className={`asset-status status-${asset.status.replace(' ', '-').toLowerCase()}`}>
                    {asset.status}
                  </span>
                </div>
                
                <div className="asset-category">
                  Categoria: {asset.category || 'Sem categoria'}
                </div>
                
                <div className="asset-metadata">
                  {asset.description && (
                    <div className="metadata-item">
                      <span className="metadata-label">Descrição:</span>
                      <span className="metadata-value">{asset.description}</span>
                    </div>
                  )}
                  {asset.location && (
                    <div className="metadata-item">
                      <span className="metadata-label">Localização:</span>
                      <span className="metadata-value">{asset.location}</span>
                    </div>
                  )}
                  {asset.purchase_date && (
                    <div className="metadata-item">
                      <span className="metadata-label">Data de Compra:</span>
                      <span className="metadata-value">
                        {new Date(asset.purchase_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  {asset.warranty_expiry && (
                    <div className="metadata-item">
                      <span className="metadata-label">Garantia:</span>
                      <span className="metadata-value">
                        {new Date(asset.warranty_expiry).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="asset-actions">
                  <button
                    className="action-btn"
                    onClick={() => setModalState({ type: 'edit', asset: asset })}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setModalState({ type: 'maintenance', asset: asset })}
                    title="Enviar para Manutenção"
                  >
                    <FaWrench />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setModalState({ type: 'decommission', asset: asset })}
                    title="Dar Baixa"
                  >
                    <FaArchive />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaBoxOpen />
            </div>
            <h3>Nenhum ativo encontrado</h3>
            <p>
              {searchTerm || activeTab !== null 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece adicionando seu primeiro ativo.'
              }
            </p>
            {!searchTerm && activeTab === null && (
              <button className="form-button" onClick={() => setModalState({ type: 'add', asset: null })}>
                <FaPlus style={{ marginRight: '8px' }} />
                Adicionar Primeiro Ativo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      {modalState.type === 'add' && (
        <AssetModal
          onClose={() => setModalState({ type: null, asset: null })}
          onSave={handleSaveAsset}
          categories={categories}
          fieldsConfig={fieldsConfig}
        />
      )}
      
      {modalState.type === 'edit' && (
        <AssetModal
          onClose={() => setModalState({ type: null, asset: null })}
          onSave={handleSaveAsset}
          existingAsset={modalState.asset}
          categories={categories}
          fieldsConfig={fieldsConfig}
        />
      )}
      
      {modalState.type === 'maintenance' && (
        <MaintenanceModal
          onClose={() => setModalState({ type: null, asset: null })}
          onSave={handleSendToMaintenance}
          asset={modalState.asset}
        />
      )}
      
             {modalState.type === 'decommission' && (
         <DecommissionModal
           onClose={() => setModalState({ type: null, asset: null })}
           onDecommission={handleDecommissionAsset}
           asset={modalState.asset}
         />
       )}
    </div>
  );
}

export default ControleDeAtivos;