import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { FaPlus, FaWrench } from 'react-icons/fa';
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
const AssetModal = ({ onClose, onSave, existingAsset, categories, fieldsConfig }) => {
  const [asset, setAsset] = useState(
    existingAsset || {
      serial_number: '',
      category: categories[0]?.name || '', 
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
        const success = await onDecommission(asset.id, reason, decommissionDate);
        setLoading(false);
        if(success) onClose();
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
        metadata: assetData.metadata || {}
      };

      // Se for edição, incluir o ID
      if (isEditing && assetData.id) {
        dataToSave.id = assetData.id;
      }

      const { error } = await supabase.from('ativos')[isEditing ? 'update' : 'insert'](dataToSave);
      if (error) {
        // Verificar se é erro de número de série duplicado
        if (error.message.includes('serial_number') || 
            error.message.includes('série') || 
            error.message.includes('already exists') ||
            error.message.includes('duplicate key')) {
          throw new Error('Este número de série já está em uso por outro ativo ativo.');
        }
        throw error;
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
          decommission_reason: reason
        })
        .eq('id', assetId);

      if (error) throw error;
      
      toast.success('Baixa registrada com sucesso!', { id: toastId });
      fetchInitialData();
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
          performed_by: 'Sistema'
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
      (asset.category === activeTab) &&
      (searchTerm.trim() === '' || 
        // Buscar no número de série
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  if (loading) return <div className="loading-state">Carregando ativos...</div>;

  return (
    <div onClick={() => setMenuState({ asset: null, position: null })}>
      <div className="assets-page-header">
        <h1>Controle de Ativos</h1>
        <div className="search-and-actions">
          <input type="search" placeholder="Buscar por número de série ou campos configurados..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <button className="form-button" onClick={() => setModalState({ type: 'add', asset: null })} disabled={categories.length === 0}>
            <FaPlus style={{ marginRight: '8px' }} />
            Novo Ativo
          </button>
        </div>
      </div>

      <div className="asset-tabs">
        {categories.map(category => (
          <button key={category.id} onClick={() => setActiveTab(category.name)} className={activeTab === category.name ? 'active' : ''}>{category.name}</button>
        ))}
      </div>

      <div className="asset-table-container">
        {categories.length > 0 && activeTab && currentHeaders.length > 0 ? (
          <table className="asset-table">
            <thead>
              <tr>
                {currentHeaders.map(header => <th key={header}>{header}</th>)}
                <th style={{textAlign: 'right'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length > 0 ? (
                filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    {currentHeaders.map(header => (
                      <td key={header}>
                        {getAssetValue(asset, header)}
                      </td>
                    ))}
                    <td className="actions-cell">
                      <button className="actions-button" onClick={(e) => handleMenuClick(asset, e)}>
                        <HiDotsVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={currentHeaders.length + 1} className="empty-state">Nenhum ativo encontrado para esta categoria.</td></tr>
              )}
            </tbody>
          </table>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <span>Nenhuma categoria de ativo foi criada. Vá para a <Link to="/configuracoes/categorias-ativos">página de gerenciamento</Link> para começar.</span>
          </div>
        ) : activeTab && (!fieldsConfig[activeTab] || fieldsConfig[activeTab].length === 0) ? (
          <div className="empty-state">
            <span>A categoria "{activeTab}" não possui campos configurados. Vá para a <Link to="/configuracoes/categorias-ativos">página de gerenciamento</Link> para adicionar campos.</span>
          </div>
        ) : (
          <div className="empty-state">
            <span>Selecione uma categoria para visualizar os ativos.</span>
          </div>
        )}
      </div>

      {menuState.asset && (
        <ActionsMenu
          asset={menuState.asset}
          position={menuState.position}
          onClose={() => setMenuState({ asset: null, position: null })}
          onEdit={(assetToEdit) => { setModalState({ type: 'edit', asset: assetToEdit }); setMenuState({ asset: null, position: null }); }}
          onDelete={(assetId) => { handleDeleteAsset(assetId); setMenuState({ asset: null, position: null }); }}
          onDecommission={(assetToDecommission) => { setModalState({ type: 'decommission', asset: assetToDecommission }); setMenuState({ asset: null, position: null }); }}
          onSendToMaintenance={(assetToSend) => { setModalState({ type: 'maintenance', asset: assetToSend }); setMenuState({ asset: null, position: null }); }}
        />
      )}
      
      {modalState.type === 'add' && <AssetModal onClose={() => setModalState({ type: null, asset: null })} onSave={handleSaveAsset} existingAsset={null} categories={categories} fieldsConfig={fieldsConfig} />}
      {modalState.type === 'edit' && <AssetModal onClose={() => setModalState({ type: null, asset: null })} onSave={handleSaveAsset} existingAsset={modalState.asset} categories={categories} fieldsConfig={fieldsConfig} />}
      {modalState.type === 'decommission' && <DecommissionModal asset={modalState.asset} onClose={() => setModalState({ type: null, asset: null })} onDecommission={handleDecommissionAsset} />}
      {modalState.type === 'maintenance' && <MaintenanceModal asset={modalState.asset} onClose={() => setModalState({ type: null, asset: null })} onSave={handleSendToMaintenance} />}
    </div>
  );
}

export default ControleDeAtivos;